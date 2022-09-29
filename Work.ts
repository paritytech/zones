import { AnyEffect } from "./Effect.ts";
import { RuntimeContext } from "./Runtime.ts";

export abstract class Work<Source extends AnyEffect = AnyEffect> {
  constructor(
    readonly context: RuntimeContext,
    readonly source: Source,
  ) {}

  abstract result(): unknown;
}
