import { E, Effect, EffectRun, T, V } from "../Effect.ts";
import { thrownAsUntypedError } from "../Error.ts";
import * as U from "../util/mod.ts";
import { Ls, Ls$ } from "./Ls.ts";

export function call<D, R>(dep: D, fn: CallLogic<D, R>): Call<D, R> {
  return new Call(dep, fn);
}
export namespace call {
  export function fac<A extends unknown[], R>(fn: (...args: A) => R) {
    return <X extends Ls$<A>>(...args: X) => {
      return new Call(
        new Ls(...args),
        fn as unknown as CallLogic<Ls<[...X]>, R>,
      );
    };
  }

  /**
   * TODO(@tjjfvi): a factory for generic call factories?
   *
   * One limitation: we can't attach doc comments to params.
   * Perhaps this factory should be constrained to be unary, where the param must be an object?
   * This would force a situation in which doc comments don't need to be attached to params,
   * as they can be attached to props instead.
   *
   * How would this look? Maybe...
   *
   * ```ts
   * export const f = generic((def) => {
   *   return def(<Props extends { val: string | number }>(
   *     props: Props,
   *   ): Props["val"] => props.val);
   * });
   * ```
   */
  export declare function gen(def: (x: any) => any): any;
}

export class Call<D = any, R = any> extends Effect<
  "Call",
  V<D>,
  E<D> | Extract<Awaited<R>, Error>,
  Exclude<Awaited<R>, Error>
> {
  constructor(
    readonly dep: D,
    readonly logic: CallLogic<D, R>,
  ) {
    super("Call", [dep, logic]);
  }

  enter: EffectRun = (state) => {
    return U.thenOk(
      state.process.resolve(this.dep),
      thrownAsUntypedError(this.logic),
    );
  };
}

export type CallLogic<D, R> = (depResolved: T<D>) => R;
