import { then } from "../common.ts";
import { $, E, Effect, EffectRun, isEffectLike, T, V } from "../Effect.ts";

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
    super("Ls", lsRun, elements);
    this.elements = elements;
  }
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]>
    : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};

const lsRun: EffectRun<Ls> = ({ process, source: { elements } }) => {
  const pending: Promise<unknown>[] = [];
  const elementsResolved = new Array(elements.length);
  let errorContainer: undefined | { instance: Error; i: number };
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
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
