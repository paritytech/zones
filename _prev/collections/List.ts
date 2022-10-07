import { $, E, EffectId, EffectState, S, T, V } from "../Effect.ts";
import { Effect } from "../Effect.ts";
import { Process } from "../Runtime.ts";
import { sig } from "../Signature.ts";
import { U2I } from "../util.ts";

export function list<Elements extends unknown[]>(
  ...elements: Elements
): List<Elements> {
  return new List([...elements]);
}

// TODO: clean this up
export type List$<Elements extends unknown[]> =
  & any[]
  & {
    [K in keyof Elements]: K extends `${number}` ? $<Elements[K]> : Elements[K];
  };
export type ListT<Elements extends unknown[]> =
  & any[]
  & {
    [K in keyof Elements]: K extends `${number}` ? T<Elements[K]> : Elements[K];
  };
export class List<Elements extends unknown[] = any[]> extends Effect<
  S<Elements[number]>,
  U2I<V<Elements[number]>>,
  E<Elements[number]>,
  ListT<Elements>
> {
  id;

  constructor(readonly elements: [...Elements]) {
    super();
    this.id = `List(${elements.map(sig.unknown).join(",")})` as EffectId;
  }

  state = (process: Process): ListState => {
    return new ListState(process, this);
  };
}

export class ListState extends EffectState<List> {
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
