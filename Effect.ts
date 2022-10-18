import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Process.ts";
import * as U from "./util/mod.ts";

declare const T_: unique symbol;
declare const E_: unique symbol;
declare const V_: unique symbol;

declare const effectId: unique symbol;
export type EffectId = U.sig.Signature & { [effectId]?: true };

export class Effect<
  T = any,
  E extends Error = Error,
  V extends PropertyKey = PropertyKey,
> {
  declare [T_]: T;
  declare [E_]: E;
  declare [V_]: V;

  id;

  constructor(
    readonly kind: string,
    readonly run: EffectInitRun,
    readonly args?: unknown[],
  ) {
    this.id = `${this.kind}(${
      this.args?.map(U.sig.of).join(",") || ""
    })` as EffectId;
  }
}

// TODO: make generic?
export type EffectInitRun = (process: Process) => () => unknown;

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}

export type EffectLike<
  T = any,
  E extends Error = Error,
  V extends PropertyKey = PropertyKey,
> = Effect<T, E, V> | Name<EffectLike<T, E, V>>;

export function isEffectLike(inQuestion: unknown): inQuestion is EffectLike {
  return inQuestion instanceof Effect || inQuestion instanceof Name;
}

// TODO: fully ensure no promises-wrappers/errors
export type T<U> = U extends EffectLike<infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : Exclude<Awaited<U>, Error>;
export type E<U> = U extends EffectLike<any, infer E> ? E : never;
export type V<U> = U extends EffectLike<any, Error, infer V> ? V
  : U extends Placeholder ? U["key"]
  : never;

export type $<T> = T | EffectLike<T> | Placeholder<PropertyKey, T>;
