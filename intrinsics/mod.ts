import { Call } from "./Call.ts";
import { Ls } from "./Ls.ts";
import { Rec } from "./Rec.ts";
import { Try } from "./Try.ts";

export type IntrinsicEffect = Call | Ls | Rec | Try;

export function isIntrinsicEffect(
  inQuestion: unknown,
): inQuestion is IntrinsicEffect {
  return inQuestion instanceof Call
    || inQuestion instanceof Ls
    || inQuestion instanceof Rec
    || inQuestion instanceof Try;
}

export * from "./Call.ts";
export * from "./Ls.ts";
export * from "./Rec.ts";
export * from "./Try.ts";
