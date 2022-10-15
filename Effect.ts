import { Placeholder } from "./Placeholder.ts";
import { RunState } from "./Runtime.ts";
import * as U from "./util/mod.ts";

declare const V_: unique symbol;
declare const E_: unique symbol;
declare const T_: unique symbol;

declare const effectId: unique symbol;
export type EffectId = U.sig.Signature & { [effectId]?: true };

export abstract class Effect<
  K extends string = string,
  V extends Placeholder = Placeholder,
  E extends Error = Error,
  T = any,
> {
  declare [V_]: V;
  declare [E_]: E;
  declare [T_]: T;

  id;
  dependencies = new Set<EffectLike>();

  constructor(
    readonly kind: K,
    readonly args?: unknown[],
  ) {
    args?.forEach((arg) => {
      if (isEffectLike(arg)) {
        this.dependencies.add(arg);
      }
    });
    this.id = `${this.kind}(${
      this.args?.map(U.sig.of).join(",") || ""
    })` as EffectId;
  }

  abstract run: EffectRun;
}

export type EffectRun = (state: RunState) => unknown;

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}

export type EffectLike<
  V extends Placeholder = Placeholder,
  E extends Error = Error,
  T = any,
> = Effect<string, V, E, T> | Name<EffectLike<V, E, T>>;

export function isEffectLike(inQuestion: unknown): inQuestion is EffectLike {
  return inQuestion instanceof Effect || inQuestion instanceof Name;
}

export type V<U> = U extends EffectLike<infer V> ? V
  : U extends Placeholder ? U
  : never;
export type E<U> = U extends EffectLike<Placeholder, infer E> ? E : never;
// TODO: fully ensure no promises-wrappers/errors
export type T<U> = U extends EffectLike<Placeholder, Error, infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : Exclude<Awaited<U>, Error>;

export type $<T> =
  | T
  | EffectLike<Placeholder, Error, T>
  | Placeholder<PropertyKey, T>;
