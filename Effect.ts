import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Process.ts";
import * as U from "./util/mod.ts";

declare const T_: unique symbol;
declare const E_: unique symbol;
declare const V_: unique symbol;

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
    readonly children?: unknown[],
  ) {
    this.id = `${this.kind}(${this.children?.map(U.id.of).join(",") || ""})`;
  }
}

// TODO: make generic?
export type EffectInitRun = (process: Process) => () => unknown;

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): string {
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
