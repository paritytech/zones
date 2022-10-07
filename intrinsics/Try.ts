import { ExitStatus } from "../common.ts";
import {
  $,
  E,
  Effect,
  EffectEnv,
  EffectId,
  EffectLike,
  EffectState,
  T,
} from "../Effect.ts";
import { Process, UnexpectedInnerError } from "../Run.ts";
import * as sig from "../Signature.ts";

function try_<
  Attempt extends EffectLike,
  FallbackR,
>(
  attempt: Attempt,
  fallback: Catch<Attempt, FallbackR>,
): Try<Attempt, FallbackR> {
  return new Try(attempt, fallback);
}
export { try_ as try };

export class Try<
  Attempt extends EffectLike = EffectLike,
  FallbackR = any,
> extends Effect<
  /* TODO */ EffectEnv,
  Extract<Awaited<FallbackR>, Error>,
  T<Attempt> | Exclude<Awaited<FallbackR>, Error>
> {
  id;

  constructor(
    readonly attempt: Attempt,
    readonly fallback: Catch<Attempt, FallbackR>,
  ) {
    super();
    this.id = `try(${attempt.id})` as EffectId;
  }

  state = (process: Process): TryState => {
    return new TryState(process, this);
  };
}

export type Catch<Target extends EffectLike, CatchR> = (
  attemptError: E<Target> | UnexpectedInnerError,
) => CatchR;

export class TryState extends EffectState<Try> {
  stage: {
    depEnters?: Promise<unknown>;
    enter?: Promise<unknown>;
    depExits?: Promise<ExitStatus>;
    exit?: Promise<ExitStatus>;
  } = {};

  result = (): unknown => {
    return undefined!;
  };

  depEnters = (): unknown => {
    return undefined!;
  };

  enter = (): unknown => {
    return undefined!;
  };

  depExits = (): unknown => {
    return undefined!;
  };

  exit = (): ExitStatus => {
    return undefined!;
  };
}
