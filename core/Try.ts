import { E, Effect, EffectLike, EffectRun, T, V } from "../Effect.ts";
import { then } from "../util/mod.ts";

export function try_<
  Attempt extends EffectLike,
  FallbackR,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Try<Attempt, FallbackR> {
  return new Try(attempt, fallback);
}
Object.defineProperty(try_, "name", {
  value: "try",
  writable: false,
});
export { try_ as try };

export class Try<Attempt extends EffectLike = EffectLike, FallbackR = any>
  extends Effect<
    "Try",
    V<Attempt>,
    Extract<Awaited<FallbackR>, Error>,
    T<Attempt> | Exclude<Awaited<FallbackR>, Error>
  >
{
  constructor(
    readonly attempt: Attempt,
    readonly fallback: Catch<Attempt, FallbackR>,
  ) {
    super("Try", [attempt, fallback]);
  }

  enter: EffectRun = ({ process }) => {
    return then.err(process.get(this.attempt.id)!.result, this.fallback);
  };
}

export type Catch<
  Target extends EffectLike,
  CatchR,
> = (attemptError: E<Target>) => CatchR;
