import { $, E, Effect, EffectRun, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Rec<Fields> {
  return new Rec(fields);
}

const recKeysPre_ = Symbol();
const recValuesPre_ = Symbol();

export class Rec<
  Fields extends Record<PropertyKey, unknown> = Record<PropertyKey, any>,
> extends Effect<
  "Rec",
  V<Fields[keyof Fields]>,
  E<Fields[keyof Fields]>,
  RecT<Fields>
> {
  keys;

  constructor(readonly fields: Fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    super("Rec", [recKeysPre_, keys, recValuesPre_, values]);
    this.keys = keys;
  }

  run: EffectRun = ({ process }) => {
    return U.thenOk(
      U.all(...Object.values(this.fields).map(process.resolve)),
      (values) => {
        return this.keys.reduce((acc, cur, i) => {
          return {
            ...acc,
            [cur]: values[i]!,
          };
        }, {});
      },
    );
  };
}

export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};
