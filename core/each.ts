import { $, EffectLike, T } from "../Effect.ts";
import { derive } from "./derive.ts";
import { ls } from "./ls.ts";

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
