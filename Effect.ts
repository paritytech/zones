import { Env } from "./Env.ts";
import * as U from "./util/mod.ts";

export interface EffectProps {
  /** A human-readable name for this type of effect */
  readonly kind: string;
  /** Any arguments (such as child effects) used in the construction this effect */
  readonly args?: unknown[];
  /** The effect-specific runtime behavior */
  readonly init: EffectInit;
}

const effect_ = Symbol();

/** A typed representation of some computation */
export interface Effect<T = any, E extends Error = Error>
  extends EffectProps, EffectUtil<T, E>
{
  /** A branded, empty object, whose presence indicates the type is an effect */
  readonly [effect_]: EffectPhantoms<T, E>;
  /** An id, which encapsulates any child/argument ids */
  readonly id: string;
  /** Execute the current effect with either a specified or new env */
  readonly run: EffectRun<T, E>;
}

/** A factory with which to create effects */
export function effect<T, E extends Error>(
  props: EffectProps,
): Effect<T, E> {
  return {
    ...props,
    [effect_]: {} as EffectPhantoms<T, E>,
    id: `${props.kind}(${props.args?.map(U.id).join(",") || ""})`,
    run(env) {
      return (env || new Env()).init(this)() as any;
    },
    ...util(),
  };
}

declare const T_: unique symbol;
declare const E_: unique symbol;
export type EffectPhantoms<T, E extends Error> = {
  /** The ok result type */
  readonly [T_]: T;
  /** The error result type */
  readonly [E_]: E;
};

export type EffectRun<T, E extends Error> = (env?: Env) => Promise<T | E>;

/** Utilities for common operations on effects */
export type EffectUtil<T, E extends Error> = {
  /** Readonly produce a new effect with a specified name */
  named(name: string): Effect<T, E>;
  /** Utility method to create a new effect that runs the current effect and indexes into its result */
  access<K extends $<keyof T>>(key: K): Effect<T[U.AssertKeyof<T, K>], E>;
  /** Override `T` */
  as<U extends T>(): Effect<U, E>;
  /** Exclude members of `E` */
  excludeErr<C extends E>(): Effect<T, Exclude<E, C>>;
  /** Stores effect-specific debugging queues */
  debug?: any;
};

function util<T, E extends Error>(): ThisType<Effect<T, E>> & EffectUtil<T, E> {
  return {
    named(name) {
      const self = this;
      return effect({
        kind: "Name",
        init: self.init,
        args: [self, name],
      });
    },
    access(key) {
      const self = this;
      return effect({
        kind: "Access",
        init(env) {
          return U.memo(() => {
            return U.thenOk(
              U.all(env.resolve(self), env.resolve(key)),
              ([target, key]) => target[key],
            );
          });
        },
        args: [self, key],
      });
    },
    as<U extends T>() {
      return this as unknown as Effect<U, E>;
    },
    excludeErr<S extends E>() {
      return this as unknown as Effect<T, Exclude<E, S>>;
    },
    debug: undefined,
  };
}

export type EffectInit<T = any, E extends Error = Error> = (
  this: Effect<T, E>,
  env: Env,
) => () => unknown;

export type T<U> = U extends Effect<infer T> ? T : Exclude<Awaited<U>, Error>;
export type E<U> = U extends Effect<any, infer E> ? E : never;

export type $<T> = T | Effect<T>;

/** Determine whether a value is an Effect */
export function isEffect(inQuestion: unknown): inQuestion is Effect {
  return typeof inQuestion === "object"
    && inQuestion !== null
    && effect_ in inQuestion;
}
