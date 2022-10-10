import { $, E, Effect, EffectState, T, V } from "../Effect.ts";
import { Process } from "../Run.ts";

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

  state = (process: Process): RecState => {
    return new RecState(process, this);
  };
}

export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};

export class RecState extends EffectState<Rec> {
  getResult = () => {};
}
