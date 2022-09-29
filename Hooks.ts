import { ExitResult, ExitStatus } from "./common.ts";
import { Work } from "./Work.ts";

export type Hook<Result> = (
  work: Work,
  result: Result,
) => ExitResult;

export type EnterHook = Hook<unknown>;
export type ExitHook = Hook<ExitStatus>;

export interface Hooks {
  enter?: EnterHook;
  exit?: ExitHook;
}
