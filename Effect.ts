import { ExitResult } from "./common.ts";
import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Run.ts";
import { Signature } from "./Signature.ts";

declare const V_: unique symbol;
declare const E_: unique symbol;
declare const T_: unique symbol;

declare const effectId: unique symbol;
export type EffectId = Signature & { [effectId]?: true };

export type EffectEnv<I = any> = Record<PropertyKey, Record<PropertyKey, I>>;

export abstract class Effect<
  V extends EffectEnv<unknown> = EffectEnv,
  E extends Error = Error,
  T = any,
> {
  declare [V_]: V;
  declare [E_]: E;
  declare [T_]: T;

  abstract id: EffectId;

  abstract state: (process: Process) => EffectState;
}

export abstract class EffectState<Source extends Effect = Effect> {
  dependents = new Set<EffectState>();

  constructor(
    readonly process: Process,
    readonly source: Source,
  ) {}

  abstract result: () => unknown;
  abstract enter: () => unknown;
  abstract exit: () => ExitResult;

  resolvePlaceholder = (placeholder: Placeholder): unknown => {
    return this.process.apply[placeholder.ns]?.[placeholder.key];
  };
}

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}

export type EffectLike<
  V extends EffectEnv<unknown> = EffectEnv,
  E extends Error = Error,
  T = any,
> = Effect<V, E, T> | Name<EffectLike<V, E, T>>;

export function isEffectLike(inQuestion: unknown): inQuestion is EffectLike {
  return inQuestion instanceof Effect || inQuestion instanceof Name;
}

export type V<U> = U extends EffectLike<infer V> ? V : never;
export type E<U> = U extends EffectLike<EffectEnv, infer E> ? E : never;
export type T<U> = U extends EffectLike<EffectEnv, Error, infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : U;

export type $<T> = T | EffectLike<EffectEnv, Error, T>;
