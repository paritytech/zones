import { Deferred, deferred } from "./deps/std/async.ts";
import {
  E,
  Effect,
  EffectId,
  EffectState,
  isEffectLike,
  S,
  T,
  V,
} from "./Effect.ts";
import { Process } from "./Runtime.ts";
import { sig } from "./Signature.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { ExitResult, ExitStatus, U2I } from "./util.ts";

export class Call<
  Dep = any,
  EnterV = any,
  EnterR = any,
  ExitV = any,
  ExitR extends ExitResult = ExitResult,
> extends Effect<
  S<Dep> | (Promise<never> extends (EnterR | ExitR) ? false : true),
  U2I<V<Dep>> & EnterV & ExitV,
  E<Dep> | Extract<Awaited<EnterR | ExitR>, Error>,
  Exclude<Awaited<EnterR>, Error>
> {
  id;

  /**
   * Container for discrete units of computation
   * @param dep a value or effect, the resolution of which is to be supplied to `enter`
   * @param enter a fn that returns either an `Error` subtype or another value (inferred as `T`)
   * @param exit a fn to be executed when the atom is no longer depended upon by parent `enter`s
   */
  constructor(
    readonly dep: Dep,
    readonly enter: (this: EnterV, dep: T<Dep>) => EnterR,
    readonly exit: (
      this: ExitV,
      enterR: Awaited<EnterR> | UnexpectedThrow,
    ) => ExitR,
  ) {
    super();
    let id = "atom("; // TODO: improved legibility?
    id += `dep(${sig.unknown(dep)}),enter_${sig.ref(this.enter)}`;
    if (this.exit) {
      id += `,exit_${sig.ref(this.exit)}`;
    }
    this.id = id + ")" as EffectId;
  }

  state = (process: Process): AtomState => {
    // @ts-ignore: fix this
    return new AtomState(process, this);
  };
}

export class AtomState extends EffectState<Call> {
  #depEnter?: Promise<unknown>;
  depEnter = () => {
    if (!this.#depEnter) {
      if (isEffectLike(this.source.dep)) {
        const state = this.process.get(this.source.id)!;
        state.result();
        this.#depEnter = state.enter();
      } else {
        this.#depEnter = this.source.dep;
      }
    }
    return this.#depEnter;
  };

  #enter?: Promise<unknown>;
  enter = (): Promise<unknown> => {
    if (!this.#enter) {
      this.#enter = this.handleUnexpectedThrow(async () => {
        const dep = await this.#depEnter!;
        if (dep instanceof Error) return dep;
        return await this.source.enter.bind(this.process.env)(dep);
      });
    }
    return this.#enter;
  };

  #depExit?: Promise<Error | void>;
  depExit = () => {
    if (!this.#depExit) {
      this.#depExit = (async () => {
        await this.enter();
        if (isEffectLike(this.source.dep)) {
          const depState = this.process.get(this.source.id)!;
          depState.dependents.delete(this);
          return depState.exit();
        }
      })();
    }
    return this.#depExit;
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
      const depEnter = this.depEnter();
      const enter = this.enter();
      const depExit = this.depExit();
      const exit = this.exit();
      this.#result = (async () => {
        await depEnter;
        const enter_ = await enter;
        const depExit_ = await depExit;
        const exit_ = await exit;
        return depExit_ || exit_ || enter_;
      })();
    }
    return this.#result;
  };
}
