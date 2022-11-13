import { Nullish } from "./types.ts"

export function isNone<I>(inQuestion: I): inQuestion is Extract<I, Nullish> {
  return inQuestion === null || inQuestion === undefined
}
