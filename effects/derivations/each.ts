import { $, Effect, T } from "../../Effect.ts";
import { ls } from "../ls.ts";
import { derive } from "./base.ts";

/**
 * Produce a new effect that is the ls of a list of new effects, produced by
 * applying the resolutions of `elements` to `cb`
 */
export function each<Elements extends $<unknown[]>, Into extends Effect>(
  elements: Elements,
  cb: (element: T<Elements>[number]) => Into,
) {
  return derive(elements, (resolved) => {
    return ls(...resolved.map(cb));
  })
    .zoned("Each");
}
