import { E, Effect, T } from "../Effect.ts";
import { Env } from "../Env.ts";
import { wrapThrows } from "../Error.ts";
import * as U from "../util/mod.ts";
import { ls, Ls$ } from "./ls.ts";

/** Create an effect which resolves to the result of `logic`, called with the resolved `dep` */
export function call<D, R>(
  dep: D,
  logic: CallLogic<D, R>,
): Effect<Exclude<Awaited<R>, Error>, E<D> | Extract<Awaited<R>, Error>> {
  return new Effect({
    kind: "Call",
    init(env) {
      return () => {
        return U.thenOk(
          env.resolve(dep),
          wrapThrows((depResolved) => logic(depResolved as T<D>, env), this),
        );
      };
    },
    args: [dep, logic],
    memoize: true,
  });
}
/** Utilities for creating and manipulating call effects */
export namespace call {
  /** A convenience utility for simpler creation of call factories */
  export function fac<A extends unknown[], R>(fn: (...args: A) => R) {
    const fnWrapped = ((a: A) => fn(...a));
    return <X extends Ls$<A>>(...args: X) => {
      const dep = ls(...args);
      return call(dep, fnWrapped as CallLogic<typeof dep, R>);
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

// TODO: decide whether we want to expose `env` moving forward / `this`?
/** The logic to be supplied to a call effect factory */
export type CallLogic<D, R> = (depResolved: T<D>, env: Env) => R;
