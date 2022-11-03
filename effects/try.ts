import { E, Effect, effect, T, V } from "../Effect.ts";
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
  Extract<Awaited<FallbackR>, Error>,
  V<Attempt>
> {
  return effect({
    kind: "Try",
    run: (process) => {
      return U.memo(() => {
        return U.thenErr(process.get(attempt.id)!(), fallback);
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
