import { ExitResult } from "./common.ts";
import { AnyEffect } from "./Effect.ts";

export type Hook<Result> = (
  source: AnyEffect,
  result: Result,
) => void;

export type EnterHook = Hook<unknown>;
export type ExitHook = Hook<ExitResult>;

export interface Hooks {
  enter?: EnterHook;
  exit?: ExitHook;
}
