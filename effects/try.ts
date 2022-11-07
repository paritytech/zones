import { E, Effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

/** If the `attempt` effect produces an error, intercept that error and return a new value */
function try_<
  Attempt extends Effect,
  FallbackR extends T<Attempt> | Error,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Effect<
  T<Attempt> | Exclude<Awaited<FallbackR>, Error>,
  Extract<Awaited<FallbackR>, Error>
> {
  return new Effect({
    kind: "Try",
    init(env) {
      // TODO: get this working properly
      return U.memo(() => {
        return U.thenErr(env.getRunner(attempt)(), fallback);
      });
    },
    args: [attempt, fallback],
  });
}
Object.defineProperty(try_, "name", {
  value: "try",
  writable: false,
});
export { try_ as try };

/** The fallback logic within a `try` effect */
export type Catch<Target extends Effect, CatchR> = (
  attemptError: E<Target>,
) => CatchR;
