import { then } from "../common.ts";
import { E, Effect, EffectLike, EffectRun, T, V } from "../Effect.ts";
import { identity } from "../util.ts";

export { try_ as try };
function try_<
  Attempt extends EffectLike,
  FallbackR,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Try<Attempt, FallbackR> {
  return new Try(attempt, fallback);
}

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
    super("Try", tryRun, [attempt, fallback]);
  }
}

export type Catch<Target extends EffectLike, CatchR> = (
  attemptError: E<Target>,
) => CatchR;

const tryRun: EffectRun<Try> = ({ process, source }) => {
  return then(process.result(source.attempt.id), identity, source.fallback);
};
