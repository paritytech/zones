import { List$, ListT } from "./collections/mod.ts";
import { E, ExitResult, ExitStatus, isEffectLike, S, V } from "./common.ts";
import { Deferred, deferred } from "./deps/std/async.ts";
import { Effect, EffectId, EffectState } from "./Effect.ts";
import { Process } from "./Runtime.ts";
import { sig } from "./Signature.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { U2I } from "./util.ts";

export function atom<
  A extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends ExitResult = void,
>(
  args: [...A],
  enter: (this: EnterV, ...args: ListT<A>) => EnterR,
  exit: (this: ExitV, enterR: Awaited<EnterR> | UnexpectedThrow) => ExitR =
    undefined!,
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
  exit: (this: ExitV, enterR: Awaited<EnterR> | UnexpectedThrow) => ExitR =
    undefined!,
) {
  return <A extends List$<X>>(
    ...args: A
  ): Atom<A, EnterV, EnterR, ExitV, ExitR> => {
    return new Atom(
      args as [...A],
      enter as (this: EnterV, ...args: ListT<A>) => EnterR,
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
    readonly enter: (this: EnterV, ...args: ListT<A>) => EnterR,
    readonly exit: (
      this: ExitV,
      enterR: Awaited<EnterR> | UnexpectedThrow,
    ) => ExitR,
  ) {
    super();
    let id = "atom("; // TODO: improved legibility?
    id += `args(${args.map(sig.unknown).join("\n")})`;
    id += `enter_${sig.ref(this.enter)}`;
    if (this.exit) {
      id += `,exit_${sig.ref(this.exit)}`;
    }
    this.id = id + ")" as EffectId;
  }

  state = (process: Process): AtomState => {
    return new AtomState(process, this);
  };
}

export class AtomState extends EffectState<Atom> {
  #childEnter?: Promise<Error | unknown[]>;
  childEnter = () => {
    if (!this.#childEnter) {
      const args: unknown[] = [];
      let errorContainer: undefined | { i: number; error: Error };
      for (let i = 0; i < this.source.args.length; i++) {
        const arg = this.source.args[i]!;
        if (isEffectLike(arg)) {
          const state = this.process.get(arg.id)!;
          state.result();
          args.push(
            state.enter().then((result) => {
              if (result instanceof Error) {
                if (!errorContainer || errorContainer.i < i) {
                  errorContainer = { i, error: result };
                }
              }
              return result;
            }),
          );
        } else {
          args.push(arg);
        }
      }
      this.#childEnter = (async () => {
        const resolved = await Promise.all(args);
        return errorContainer?.error || resolved;
      })();
    }
    return this.#childEnter;
  };

  #enter?: Promise<unknown>;
  enter = (): Promise<unknown> => {
    if (!this.#enter) {
      this.#enter = this.handleUnexpectedThrow(async () => {
        const args = await this.#childEnter!;
        if (args instanceof Error) return args;
        return await this.source.enter.bind(this.process.env)(...args);
      });
    }
    return this.#enter;
  };

  #childExit?: Promise<Error | void>;
  childExit = () => {
    if (!this.#childExit) {
      this.#childExit = (async () => {
        await this.enter();
        const exits: Promise<unknown>[] = [];
        let errorContainer: undefined | { i: number; error: Error };
        for (let i = 0; i < this.source.args.length; i++) {
          const arg = this.source.args[i]!;
          if (isEffectLike(arg)) {
            const argState = this.process.get(arg.id)!;
            argState.dependents.delete(this);
            const exitResult = argState.exit();
            exits.push(
              (exitResult instanceof Promise
                ? exitResult
                : Promise.resolve(exitResult)).then((result) => {
                  if (result instanceof Error) {
                    if (!errorContainer || errorContainer.i < i) {
                      errorContainer = { i, error: result };
                    }
                  }
                  return result;
                }),
            );
          }
        }
        this.#childExit = (async () => {
          await Promise.all(exits);
          return errorContainer?.error;
        })();
      })();
    }
    return this.#childExit;
  };

  #exit?: Deferred<ExitStatus>;
  exit = () => {
    if (!this.#exit) {
      this.#exit = deferred<ExitStatus>();
    }
    if (!this.source.exit) {
      this.#exit.resolve();
    } else if (!this.dependents.size) {
      this.handleUnexpectedThrow(async () => {
        return await this.source.exit.bind(this.process.env)(
          await this.enter(),
        );
      }).then(this.#exit.resolve);
    }
    return this.#exit;
  };

  #result?: Promise<unknown>;
  result = () => {
    if (!this.#result) {
      const childEnter = this.childEnter();
      const enter = this.enter();
      const childExit = this.childExit();
      const exit = this.exit();
      this.#result = (async () => {
        await childEnter;
        const enter_ = await enter;
        const childExit_ = await childExit;
        const exit_ = await exit;
        return childExit_ || exit_ || enter_;
      })();
    }
    return this.#result;
  };
}
