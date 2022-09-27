import { ExitStatus } from "./common.ts";
import { AnyEffect } from "./Effect.ts";

export type Hook<Result> = (
  source: AnyEffect,
  result: Result,
) => void | Promise<void>;

export type EnterHook = Hook<unknown>;
export type ExitHook = Hook<ExitStatus>;

export interface Hooks {
  enter?: EnterHook;
  exit?: ExitHook;
}
