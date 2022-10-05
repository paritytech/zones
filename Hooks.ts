import { ExitResult, ExitStatus } from "./common.ts";
import { EffectState } from "./Process.ts";

export abstract class Hooks {
  abstract enter: (
    work: EffectState,
    enterResult: unknown,
  ) => ExitResult;
  abstract exit: (
    work: EffectState,
    exitResult: ExitStatus,
  ) => ExitResult;
}
