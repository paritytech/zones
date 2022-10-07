import { ExitResult } from "../common.ts";
import { E, Effect, EffectEnv, EffectId, EffectState, T } from "../Effect.ts";
import { Process, UnexpectedInnerError } from "../Run.ts";
import * as sig from "../Signature.ts";

export function call<
  D,
  EnterR,
  ExitR extends ExitResult = void,
>(
  dep: D,
  enter: CallEnter<D, EnterR>,
  exit: CallExit<EnterR, ExitR> = undefined!,
): Call<D, EnterR, ExitR> {
  return new Call(dep, enter, exit);
}

export class Call<
  D = any,
  EnterR = any,
  ExitR extends ExitResult = ExitResult,
> extends Effect<
  EffectEnv, /* TODO */
  E<D> | Extract<Awaited<EnterR | ExitR>, Error>,
  Exclude<Awaited<EnterR>, Error>
> {
  id;

  constructor(
    readonly dep: D,
    readonly enter: CallEnter<D, EnterR>,
    readonly exit: CallExit<EnterR, ExitR>,
  ) {
    super();
    this.id = `call(${
      [
        sig.of(dep),
        sig.weak.of(enter),
        sig.weak.of(exit),
      ].join(",")
    })` as EffectId;
  }

  state = (process: Process): CallState => {
    return new CallState(process, this);
  };
}

export type CallEnter<D, EnterR> = (dep: T<D>) => EnterR;
export type CallExit<
  EnterR,
  ExitR extends ExitResult,
> = (enterResult: Awaited<EnterR> | UnexpectedInnerError) => ExitR;

export class CallState extends EffectState<Call> {
  stage: {
    depEnter?: Promise<unknown>;
    enter?: Promise<unknown>;
    depExit?: ExitResult;
    exit?: ExitResult;
  } = {};

  result = (): unknown => {
    return undefined!;
  };

  depEnter = (): unknown => {
    return undefined!;
  };

  enter = (): unknown => {
    return undefined!;
  };

  depExit = (): unknown => {
    return undefined!;
  };

  exit = (): ExitResult => {
    return undefined!;
  };
}
