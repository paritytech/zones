import { E, Effect, EffectLike, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function try_<
  Attempt extends EffectLike,
  FallbackR extends T<Attempt> | Error,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Effect<
  T<Attempt> | Exclude<Awaited<FallbackR>, Error>,
  Extract<Awaited<FallbackR>, Error>,
  V<Attempt>
> {
  return new Effect("Try", ({ process }) => {
    // TODO: fix this
    return U.thenErr(process.get(attempt.id)!.result, fallback);
  }, [attempt, fallback]);
}
Object.defineProperty(try_, "name", {
  value: "try",
  writable: false,
});
export { try_ as try };

export type Catch<
  Target extends EffectLike,
  CatchR,
> = (attemptError: E<Target>) => CatchR;
