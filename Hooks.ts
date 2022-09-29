import { ExitResult, ExitStatus } from "./common.ts";
import { Work } from "./Work.ts";

export abstract class Hooks {
  abstract enter: (work: Work, enterResult: unknown) => ExitResult;
  abstract exit: (work: Work, exitResult: ExitStatus) => ExitResult;
}
