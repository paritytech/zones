import { ExitStatus } from "../common.ts";
import {
  $,
  E,
  Effect,
  EffectEnv,
  EffectId,
  EffectState,
  T,
} from "../Effect.ts";
import { Process } from "../Run.ts";
import * as sig from "../Signature.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Rec<Fields> {
  return new Rec(fields);
}

export class Rec<
  Fields extends Record<PropertyKey, unknown> = Record<PropertyKey, any>,
> extends Effect</* TODO */ EffectEnv, E<Fields[keyof Fields]>, RecT<Fields>> {
  id;

  constructor(readonly fields: Fields) {
    super();
    this.id = `rec(${
      Object
        .entries(fields)
        .map(([k, v]) => `${sig.strong.of(k)}:${sig.of(v)}`)
        .join(",")
    })` as EffectId;
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
  stage: {
    depEnters?: Promise<unknown>;
    enter?: Promise<unknown>;
    depExits?: Promise<ExitStatus>;
    exit?: Promise<ExitStatus>;
  } = {};

  result = (): unknown => {
    return undefined!;
  };

  depEnters = (): unknown => {
    return undefined!;
  };

  enter = (): unknown => {
    return undefined!;
  };

  depExits = (): unknown => {
    return undefined!;
  };

  exit = (): ExitStatus => {
    return undefined!;
  };
}
