import { $, E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

/** Create an effect that resolves to a list of the specified elements resolved */
export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Effect<LsT<Elements>, E<Elements[number]>> {
  return effect({
    kind: "Ls",
    init(env) {
      return U.memo(() => {
        return U.all(...elements.map(env.resolve));
      });
    },
    args: elements,
  });
}

/** Map a list's element types into their `$` counterparts (maybe effects) */
export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]> : Elements[K];
};
/** Map a list's element types into their `T` counterparts (resolved) */
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};
