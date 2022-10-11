import { $, E, Effect, EffectRun, T, V } from "../Effect.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Rec<Fields> {
  return new Rec(fields);
}

export class Rec<
  Fields extends Record<PropertyKey, unknown> = Record<PropertyKey, any>,
> extends Effect<
  "Rec",
  V<Fields[keyof Fields]>,
  E<Fields[keyof Fields]>,
  RecT<Fields>
> {
  constructor(readonly fields: Fields) {
    super("Rec", Object.values(fields));
    // // TODO
    // this.inner = Object
    //   .entries(fields)
    //   .map(([k, v]) => `${sig.strong.of(k)}:${sig.of(v)}`)
    //   .join(",");
  }

  enter: EffectRun = () => {};
}

export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};
