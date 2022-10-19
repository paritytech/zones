import { $, EffectLike, T } from "../../Effect.ts";
import { ls } from "../Ls.ts";
import { derive } from "./Derive.ts";

export function each<
  Elements extends $<unknown[]>,
  Into extends EffectLike,
>(
  elements: Elements,
  cb: (element: T<Elements>[number]) => Into,
) {
  return derive(elements, (resolved) => {
    return ls(...resolved.map(cb));
  });
}
