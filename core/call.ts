import { E, Effect, T, V } from "../Effect.ts";
import { thrownAsUntypedError } from "../Error.ts";
import * as U from "../util/mod.ts";
import { ls, Ls$ } from "./ls.ts";

export function call<D, R>(dep: D, logic: CallLogic<D, R>): Effect<
  Exclude<Awaited<R>, Error>,
  E<D> | Extract<Awaited<R>, Error>,
  V<D>
> {
  return new Effect("Call", (process) => {
    return U.memo(() => {
      return U.thenOk(process.resolve(dep), thrownAsUntypedError(logic));
    });
  }, [dep, logic]);
}
export namespace call {
  export function fac<A extends unknown[], R>(fn: (...args: A) => R) {
    return <X extends Ls$<A>>(...args: X) => {
      const dep = ls(...args);
      return call(dep, fn as unknown as CallLogic<typeof dep, R>);
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

export type CallLogic<D, R> = (depResolved: T<D>) => R;
