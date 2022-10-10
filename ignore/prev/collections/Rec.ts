import { $, E, EffectId, EffectState, S, T, V } from "../Effect.ts";
import { Effect } from "../Effect.ts";
import { Process } from "../Runtime.ts";
import { sig } from "../Signature.ts";
import { U2I } from "../util.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Rec<Fields> {
  return new Rec(fields);
}

export type Rec$<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: $<Fields[K]>;
};
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};
export class Rec<
  Fields extends Record<PropertyKey, unknown> = Record<PropertyKey, any>,
> extends Effect<
  S<Fields[keyof Fields]>,
  U2I<V<Fields[keyof Fields]>>,
  E<Fields[keyof Fields]>,
  RecT<Fields>
> {
  id;

  constructor(readonly fields: Fields) {
    super();
    this.id = `Rec(${
      Object.entries(fields).map(([key, val]) => {
        return `${key}:${sig.unknown(val)}`;
      }).join(",")
    })` as EffectId;
  }

  state = (process: Process): RecState => {
    return new RecState(process, this);
  };
}

export class RecState extends EffectState<Rec> {
  enter = () => {
    return undefined!;
  };

  exit = () => {
    return Promise.resolve();
  };

  result = () => {
    return undefined!;
  };
}
