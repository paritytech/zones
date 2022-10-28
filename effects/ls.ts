import { $, E, Effect, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Effect<LsT<Elements>, E<Elements[number]>, V<Elements[number]>> {
  return new Effect("Ls", (process) => {
    return U.memo(() => {
      return U.all(...elements.map(process.resolve));
    });
  }, elements);
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]> : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};
