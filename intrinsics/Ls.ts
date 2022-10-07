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

export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Ls<Elements> {
  return new Ls(...elements);
}

export class Ls<Elements extends unknown[] = any[]>
  extends Effect</* TODO */ EffectEnv, E<Elements[number]>, LsT<Elements>>
{
  id;
  elements;

  constructor(...elements: Elements) {
    super();
    this.id = `ls(${elements.map(sig.of).join(",")})` as EffectId;
    this.elements = elements;
  }

  state = (process: Process): LsState => {
    return new LsState(process, this);
  };
}

export type Ls$<Elements> = { [K in keyof Elements]: $<Elements[K]> };
export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>;
};

export class LsState extends EffectState<Ls> {
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
