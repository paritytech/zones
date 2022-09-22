import { Work } from "./Work.ts";

export class UnexpectedThrow extends Error {
  override readonly name = "UnexpectedThrow";

  constructor(
    readonly thrown: unknown,
    readonly work: Work,
  ) {
    super(UNEXPECTED_THROW_MSG);
  }
}

// TODO: do we want to enable effect developers to provide links / make use of context to form tailored,
// effect-specific messages, which may be more helpful or even encourage collaboration on issues? Y E S.
const UNEXPECTED_THROW_MSG = [
  "An unexpected error was thrown (not returned) from within the logic of an effect.",
  "This does not indicate an issue with the effect runtime, but rather with the effect(s).",
  "You can index into this very error's `work` prop, which contains a reference to the source effect",
  "and execution context. In the future, we hope to extend Zones with utilities that enable",
  "simple inspection a given piece of `Work` (to determine the offending effect).",
].join(" ");
