import { AnyEffect } from "./Effect.ts";

export class UnknownError extends Error {
  override readonly name = "UnknownError";

  constructor(
    readonly thrown: unknown,
    readonly source: AnyEffect,
  ) {
    super(UNKNOWN_ERROR_MESSAGE);
  }
}

// TODO: do we want to enable effect developers to provide links / make use of context to form tailored,
// effect-specific messages, which may be more helpful or even encourage collaboration on issues? Y E S.
const UNKNOWN_ERROR_MESSAGE = [
  "An unexpected error was thrown (not returned) from within the logic of an effect.",
  "This does not indicate an issue with the effect runtime, but rather with the effect(s).",
  "You can index into the `source` prop of this very error instance as a means of determining the offending effect.",
].join(" ");
