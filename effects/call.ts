import { E, Effect, effect, T } from "../Effect.ts";
import { Env } from "../Env.ts";
import { thrownAsUntypedError } from "../Error.ts";
import * as U from "../util/mod.ts";
import { ls, Ls$ } from "./ls.ts";

export function call<D, R>(
  dep: D,
  logic: CallLogic<D, R>,
): Effect<Exclude<Awaited<R>, Error>, E<D> | Extract<Awaited<R>, Error>> {
  const e = effect({
    kind: "Call",
    init(env) {
      return U.memo((): unknown => {
        return U.thenOk(
          env.resolve(dep),
          thrownAsUntypedError(
            e,
            (depResolved) => logic(depResolved as T<D>, env),
          ),
        );
      });
    },
    args: [dep, logic],
  });
  return e as any;
}
export namespace call {
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
export type CallLogic<D, R> = (depResolved: T<D>, env: Env) => R;
