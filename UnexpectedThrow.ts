import { AnyEffect } from "./Effect.ts";

export class UnexpectedThrow extends Error {
  override readonly name = "UnexpectedThrow";

  constructor(
    readonly thrown: unknown,
    readonly source: AnyEffect,
  ) {
    super(UNEXPECTED_THROW_MSG);
  }
}

// TODO: do we want to enable effect developers to provide links / make use of context to form tailored,
// effect-specific messages, which may be more helpful or even encourage collaboration on issues? Y E S.
const UNEXPECTED_THROW_MSG =
  "An unexpected throw occurred within the logic of an effect. You can index into this error's `source` to see which.";
