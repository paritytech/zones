import { E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

// TODO: fix this
export function try_<
  Attempt extends Effect,
  FallbackR extends T<Attempt> | Error,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Effect<
  T<Attempt> | Exclude<Awaited<FallbackR>, Error>,
  Extract<Awaited<FallbackR>, Error>
> {
  return effect({
    kind: "Try",
    init(env) {
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

export type Catch<Target extends Effect, CatchR> = (
  attemptError: E<Target>,
) => CatchR;
