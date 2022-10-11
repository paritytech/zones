import { $, E, Effect, EffectRun, isEffectLike, T, V } from "../Effect.ts";
import { then } from "../util/mod.ts";

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

  enter: EffectRun = ({ process }) => {
    const pending: Promise<unknown>[] = [];
    const elementsResolved = new Array(this.elements.length);
    let errorContainer: undefined | { instance: Error; i: number };
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i]!;
      if (isEffectLike(element)) {
        const result = then(process.get(element.id)!.result, (ok) => {
          elementsResolved[i] = ok;
        }, (err) => {
          errorContainer = { instance: err, i };
        });
        if (result instanceof Promise) {
          pending.push(result);
        }
      } else {
        elementsResolved[i] = element;
      }
    }
    return then(pending.length ? Promise.all(pending) : undefined, () => {
      return errorContainer?.instance || elementsResolved;
    });
  };
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]>
    : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};
