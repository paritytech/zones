import { then } from "../common.ts";
import { $, E, Effect, EffectState, isEffectLike, T, V } from "../Effect.ts";
import { Process } from "../Run.ts";

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

  state = (process: Process): LsState => {
    return new LsState(process, this);
  };
}

export type Ls$<Elements> = {
  [K in keyof Elements]: K extends `${number}` ? $<Elements[K]>
    : Elements[K];
};
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};

export class LsState extends EffectState<Ls> {
  getResult = () => {
    if (!("result" in this)) {
      const pending: Promise<unknown>[] = [];
      const elementsResolved = new Array(this.source.elements.length);
      let errContainer: undefined | { instance: Error; i: number };
      for (let i = 0; i < this.source.elements.length; i++) {
        const element = this.source.elements[i]!;
        if (isEffectLike(element)) {
          const elementState = this.process.get(element.id)!;
          const result = then(
            then(
              elementState.getResult(),
              (ok) => {
                elementsResolved[i] = ok;
              },
              (err) => {
                errContainer = { instance: err, i };
              },
            ),
            () => {
              return elementState.removeDependent(this);
            },
          );
          if (result instanceof Promise) {
            pending.push(result);
          }
        } else {
          elementsResolved[i] = element;
        }
      }
      this.result = then(
        pending.length ? Promise.all(pending) : undefined,
        () => {
          return errContainer?.instance || elementsResolved;
        },
      );
    }
    return this.result;
  };
}
