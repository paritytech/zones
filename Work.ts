import { ExitResult } from "./common.ts";
import { AnyEffect } from "./Effect.ts";
import { Context, State } from "./Runtime.ts";

export abstract class Work<Source extends AnyEffect = AnyEffect> {
  abstract enter: Run<unknown>;
  abstract exit: Run<ExitResult>;

  constructor(
    readonly context: Context,
    readonly source: Source,
  ) {}
}

type Run<T> = (state: State) => T;
