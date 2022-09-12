import { Effect } from "./Effect.ts";
import { Name } from "./Name.ts";

export type EffectLike<
  S extends boolean = boolean,
  V = any,
  E extends Error = Error,
  T = any,
> = Effect<S, V, E, T> | Name<EffectLike<S, V, E, T>>;

export function isEffectLike(inQuestion: unknown): inQuestion is EffectLike {
  return inQuestion instanceof Effect || inQuestion instanceof Name;
}

export type $<T> = T | EffectLike<boolean, any, Error, T>;

export type S<U> = U extends EffectLike<infer S, any, Error, any> ? S : never;
export type V<U> = U extends EffectLike<boolean, infer V, Error, any> ? V
  : never;
export type E<U> = U extends EffectLike<boolean, any, infer E, any> ? E : never;
export type T<U> = U extends EffectLike<boolean, any, Error, infer T> ? T : U;

export type Collection$<C> = { [K in keyof C]: $<C[K]> };
export type CollectionT<C> = { [K in keyof C]: T<C[K]> };
