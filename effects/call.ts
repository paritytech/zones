import { T } from "../Effect.ts";
import { Effect } from "../Effect.ts";
import { ls, Ls$ } from "./ls.ts";

/** Create an effect that executes the supplied nullary fn */
export function call<R>(
  fn: () => R,
): Effect<Exclude<R, Error>, Extract<R, Error>> {
  return new Effect({
    kind: "Call",
    impl: () => fn,
    items: [fn],
    memoize: true,
  });
}

/** Utilities for defining custom logic */
export namespace call {
  /**
   * A convenience utility for simpler creation of effect factories from fns
   * TODO(@tjjfvi): a factory for generic call factories
   * ... how is this going to look?
   */
  export function fac<A extends unknown[], R>(fn: (...args: A) => R) {
    const fnWrapped = (a: A) => fn(...a);
    return <X extends Ls$<A>>(...args: X) => {
      const args_ = ls(...args);
      return args_.next(fnWrapped as (args: T<typeof args_>) => R);
    };
  }
}
