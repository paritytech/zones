import { $, Effect, T } from "../../Effect.ts";
import { ls } from "../ls.ts";
import { derive } from "./base.ts";

export function each<Elements extends $<unknown[]>, Into extends Effect>(
  elements: Elements,
  cb: (element: T<Elements>[number]) => Into,
) {
  return derive(elements, (resolved) => {
    return ls(...resolved.map(cb));
  }).named("Each");
}
