import { ExitResult } from "./common.ts";
import { AnyEffect } from "./Effect.ts";

export type Hook<Args extends unknown[], R> = (
  source: AnyEffect,
  ...args: Args
) => R;

export type EnterHook<R> = Hook<[enterResult: unknown], R>;
export type ExitHook<R> = Hook<[exitResult: ExitResult], R>;

export type Hooks<R = void> = {
  enter?: EnterHook<R>;
  exit?: ExitHook<R>;
};
