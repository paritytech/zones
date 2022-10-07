import { EffectState } from "./Effect.ts";
import { ExitResult, ExitStatus } from "./util.ts";

export abstract class Hooks {
  abstract enter: (state: EffectState, enterResult: unknown) => ExitResult;
  abstract exit: (state: EffectState, exitResult: ExitStatus) => ExitResult;
}
