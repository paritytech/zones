import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Process.ts";
import * as U from "./util/mod.ts";

export interface EffectProps {
  /** A human-readable name for this type of effect */
  readonly kind: string;
  /** Any arguments (such as child effects) used in the construction this effect */
  readonly args?: unknown[];
  /** The effect-specific runtime behavior */
  readonly run: EffectInitRun;
}

/** A factory with which to create effects */
export function effect<T, E extends Error, V extends PropertyKey>(
  props: EffectProps,
): Effect<T, E, V> {
  return {
    ...props,
    [effect_]: {} as EffectChannels<T, E, V>,
    id: `${props.kind}(${props.args?.map(U.id.of).join(",") || ""})`,
    access(key) {
      return effect({
        kind: "Access",
        run: (process) => {
          return U.memo(() => {
            return U.thenOk(
              U.all(process.resolve(this), process.resolve(key)),
              ([target, key]) => target[key],
            );
          });
        },
        args: [this, key],
      });
    },
    as<U extends T>() {
      return this as unknown as Effect<U, E, V>;
    },
    excludeErr<S extends E>() {
      return this as unknown as Effect<T, Exclude<E, S>, V>;
    },
  };
}

const effect_ = Symbol();

/** A typed representation of some computation */
export interface Effect<
  T = any,
  E extends Error = Error,
  V extends PropertyKey = PropertyKey,
> extends EffectProps {
  /** A branded, empty object, whose presence indicates the type is an effect */
  readonly [effect_]: EffectChannels<T, E, V>;
  /** An id, which encapsulates any child/argument ids */
  readonly id: string;
  /** Utility method to create a new effect that runs the current effect and indexes into its result */
  readonly access: EffectAccess<T, E, V>;
  /** Override `T` */
  readonly as: EffectAs<T, E, V>;
  /** Exclude members of `E` */
  readonly excludeErr: EffectExcludeErr<T, E, V>;
}

declare const T_: unique symbol;
declare const E_: unique symbol;
declare const V_: unique symbol;
export type EffectChannels<T, E extends Error, V extends PropertyKey> = {
  /** The ok result type */
  readonly [T_]: T;
  /** The error result type */
  readonly [E_]: E;
  /** Dependencies required by the effect tree */
  readonly [V_]: V;
};

export type EffectAccess<T, E extends Error, V extends PropertyKey> = <
  K extends $<keyof T>,
>(key: K) => Effect<T[U.AssertKeyof<T, K>], E, V>;

export type EffectAs<T, E extends Error, V extends PropertyKey> = <
  U extends T,
>() => Effect<U, E, V>;

export type EffectExcludeErr<
  T,
  E extends Error,
  V extends PropertyKey,
> = <C extends E>() => Effect<T, Exclude<E, C>, V>;

export type EffectInitRun = (process: Process) => () => unknown;

export type T<U> = U extends Effect<infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : Exclude<Awaited<U>, Error>;
export type E<U> = U extends Effect<any, infer E> ? E : never;
export type V<U> = U extends Effect<any, Error, infer V> ? V
  : U extends Placeholder ? U["key"]
  : never;

export type $<T> = T | Effect<T> | Placeholder<PropertyKey, T>;

/** Determine whether a value is an Effect */
export function isEffect(inQuestion: unknown): inQuestion is Effect {
  return typeof inQuestion === "object"
    && inQuestion !== null
    && effect_ in inQuestion;
}
