import { Process } from "./Runtime.ts";
import { Signature } from "./Signature.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { ExitResult } from "./util.ts";

declare const S_: unique symbol;
declare const V_: unique symbol;
declare const E_: unique symbol;
declare const T_: unique symbol;

declare const effectId_: unique symbol;
export type EffectId = Signature & { [effectId_]: true };

export abstract class Effect<
  S extends boolean,
  V,
  E extends Error,
  T,
> {
  declare [S_]: S;
  declare [V_]: V;
  declare [E_]: E;
  declare [T_]: T;

  abstract id: EffectId;

  abstract state: (process: Process) => EffectState;
}

export type AnyEffect = Effect<boolean, any, Error, any>;

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}

export abstract class EffectState<Source extends AnyEffect = AnyEffect> {
  dependents = new Set<EffectState>();

  constructor(
    readonly process: Process,
    readonly source: Source,
  ) {}

  abstract enter: () => Promise<unknown>;
  abstract exit: () => Promise<ExitResult>;
  abstract result: () => Promise<unknown>;

  // TODO: cleanup
  handleUnexpectedThrow = async <T>(
    fn: () => T,
  ): Promise<Awaited<T> | UnexpectedThrow> => {
    try {
      return await fn();
    } catch (e) {
      return new UnexpectedThrow(e, this.source);
    }
  };
}

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
