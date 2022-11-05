import { $, E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Effect<LsT<Elements>, E<Elements[number]>> {
  return effect({
    kind: "Ls",
    init(env) {
      return U.memo(() => {
        return U.all(...elements.map(env.resolve)) as any;
      });
    },
    args: elements,
  });
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]> : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};
