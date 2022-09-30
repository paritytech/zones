import {
  Collection$,
  CollectionT,
  E,
  ExitResult,
  ExitStatus,
  isEffectLike,
  S,
  V,
} from "./common.ts";
import { unimplemented } from "./deps/std/testing/asserts.ts";
import { Effect, EffectId } from "./Effect.ts";
import { RuntimeContext } from "./Runtime.ts";
import { sig } from "./Signature.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { U2I } from "./util.ts";
import { Work } from "./Work.ts";

export function atom<
  A extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends ExitResult = void,
>(
  args: [...A],
  enter: (this: EnterV, ...args: CollectionT<A>) => EnterR,
  exit: (this: ExitV, enterR: EnterR) => ExitR = undefined!,
): Atom<A, EnterV, EnterR, ExitV, ExitR> {
  return new Atom(args, enter, exit);
}

// TODO(@tjjfvi): should we swap this out with the generic-fn-friendly factory?
export function atomf<
  X extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends ExitResult = void,
>(
  enter: (this: EnterV, ...args: X) => EnterR,
  exit: (this: ExitV, enterR: EnterR) => ExitR = undefined!,
) {
  return <A extends Collection$<X>>(
    ...args: A
  ): Atom<A, EnterV, EnterR, ExitV, ExitR> => {
    return new Atom(
      args as [...A],
      enter as (this: EnterV, ...args: CollectionT<A>) => EnterR,
      exit,
    );
  };
}

export class Atom<
  A extends unknown[] = any[],
  EnterV = any,
  EnterR = any,
  ExitV = any,
  ExitR extends ExitResult = ExitResult,
> extends Effect<
  S<A[number]> | (Promise<never> extends (EnterR | ExitR) ? false : true),
  U2I<V<A[number]>> & EnterV & ExitV,
  E<A[number]> | Extract<Awaited<EnterR | ExitR>, Error>,
  Exclude<Awaited<EnterR>, Error>
> {
  id;

  /**
   * Container for discrete units of computation
   * @param args effects, the `T` of which are to be supplied to `enter`
   * @param enter a fn that returns either an `Error` subtype or another value (inferred as `T`)
   * @param exit a fn to be executed when the atom is no longer depended upon by parent `enter`s
   */
  constructor(
    readonly args: [...A],
    readonly enter: (this: EnterV, ...args: CollectionT<A>) => EnterR,
    readonly exit: (this: ExitV, enterR: EnterR) => ExitR,
  ) {
    super();
    let id = "atom("; // TODO: improved legibility?
    if (this.args.length) {
      id += "args(";
      for (const arg of this.args) {
        id += sig.unknown(arg) + ",";
        if (arg instanceof Effect) {
          if (this.dependencies) {
            this.dependencies.add(arg);
          } else {
            this.dependencies = new Set([arg]);
          }
        }
      }
      id += "),";
    }
    id += `enter_${sig.ref(this.enter)}`;
    if (this.exit) {
      id += `,exit_${sig.ref(this.exit)}`;
    }
    this.id = id + ")" as EffectId;
  }

  work = (context: RuntimeContext): AtomWork => {
    return new AtomWork(context, this);
  };
}

export class AtomWork extends Work<Atom> {
  declare value?: unknown;

  result = () => {
    if (!("value" in this)) {
      this.value = this.#result();
    }
    return this.value;
  };

  #result = async () => {
    // 1. resolve args
    const args = await this.#enterArgs();
    // 2. execute enter
    const result = await this.#enter(args);
    // 3. execute dependency exits if no more dependents
    await this.#exitArgs();
    // 4. execute current exit if root
    !this.context.dependents(this.source.id) && await this.#exit();
    // 5. return the result
    return result;
  };

  #enterArgs = async (): Promise<unknown[]> => {
    const resolved = new Array<unknown>(this.source.args.length);
    const pending: Promise<unknown>[] = [];
    for (let i = 0; i < this.source.args.length; i++) {
      const arg = this.source.args[i]!;
      if (isEffectLike(arg)) {
        const argEnterResult = this.context.result(arg.id);
        if (argEnterResult instanceof Promise) {
          pending.push(argEnterResult.then((result) => {
            resolved[i] = result;
          }));
        } else {
          resolved[i] = argEnterResult;
        }
      } else {
        resolved[i] = arg;
      }
    }
    await Promise.all(pending);
    return resolved;
  };

  #enter = async (args: unknown[]): Promise<unknown> => {
    let result: unknown;
    try {
      result = await this.source.enter.bind(this.context.env)(...args);
      this.source.dependencies?.forEach(({ id }) => {
        this.context.dependents(id)?.delete(this.source.id);
      });
    } catch (e) {
      result = new UnexpectedThrow(e, this.source);
    }
    if (result instanceof Error) {
      return this.context.reject(result);
    }
    return result;
  };

  #exitArgs = async () => {
    if (this.source.dependencies) {
      const pending: Promise<unknown>[] = [];
      for (const { id } of this.source.dependencies) {
        const dependencyDependents = this.context.dependents(id);
        if (dependencyDependents?.size === 0) {
          const work = this.context.work(id);
          if (work instanceof AtomWork) {
            pending.push(work.#exit());
          } else {
            unimplemented();
          }
        }
      }
      await Promise.all(pending);
    }
  };

  #exit = async () => {
    if (this.source.exit) {
      let result: ExitStatus;
      try {
        result = await this.source.exit.bind(this.context.env)(
          await this.value,
        );
      } catch (e) {
        result = new UnexpectedThrow(e, this.source);
      }
      if (result instanceof Error) {
        this.context.reject(result);
      }
    }
  };
}
