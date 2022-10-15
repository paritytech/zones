import { $, E, Effect, EffectRun, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Ls<Elements> {
  return new Ls(...elements);
}

export class Ls<Elements extends unknown[] = any[]>
  extends Effect<"Ls", V<Elements[number]>, E<Elements[number]>, LsT<Elements>>
{
  elements;

  constructor(...elements: Elements) {
    super("Ls", elements);
    this.elements = elements;
  }

  run: EffectRun = ({ process }) => {
    return U.all(...this.elements.map(process.resolve));
  };
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]> : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};
