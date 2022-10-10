import { E, Effect, EffectLike, EffectState, T, V } from "../Effect.ts";
import { Process } from "../Run.ts";

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
    super("Try", [attempt, fallback]);
  }

  state = (process: Process): TryState => {
    return new TryState(process, this);
  };
}

export type Catch<Target extends EffectLike, CatchR> = (
  attemptError: E<Target>,
) => CatchR;

export class TryState extends EffectState<Try> {
  getResult = () => {};
}
