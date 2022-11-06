import { Env } from "./Env.ts";
import * as U from "./util/mod.ts";

/** Props required by the `effect` factory */
export interface EffectProps {
  /** A human-readable name for this type of effect */
  readonly kind: string;
  /** Any arguments (such as child effects) used in the construction this effect */
  readonly args?: unknown[];
  /** The effect-specific runtime behavior */
  readonly init: EffectInit;
}

const effect_ = Symbol();
const denoCustomInspect = Symbol.for("Deno.customInspect");
const nodeCustomInspect = Symbol.for("nodejs.util.inspect.custom");

/** A factory with which to create effects */
export function effect<T, E extends Error>(props: EffectProps): Effect<T, E> {
  return {
    [effect_]: {} as EffectPhantoms<T, E>,
    id: `${props.kind}(${props.args?.map(U.id).join(",") || ""})`,
    run(env) {
      return (env || new Env()).init(this)() as any;
    },
    [denoCustomInspect](inspect, options) {
      return this.inspect((value) => inspect(value, options));
    },
    [nodeCustomInspect](_0, _1, inspect) {
      return this.inspect(inspect);
    },
    inspect: inspectEffect,
    ...props,
    ...util(),
  };
}

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
  /** If defined, `zone` is the name of the serialization boundary */
  readonly zone?: string;
  /** Custom inspect for improved legibility of logs */
  inspect(inspect: Inspect): string;
  [denoCustomInspect]: DenoInspect;
  [nodeCustomInspect]: NodeInspect;
}

declare const T_: unique symbol;
declare const E_: unique symbol;
/** Effect control flow representations */
export type EffectPhantoms<T, E extends Error> = {
  /** The ok result type */
  readonly [T_]: T;
  /** The error result type */
  readonly [E_]: E;
};

/** The method with which one executes an effect */
export type EffectRun<T, E extends Error> = (env?: Env) => Promise<T | E>;

/** Utilities for common operations on effects */
export type EffectUtil<T, E extends Error> = {
  /** Readonly produce a new effect with a specified name */
  zoned(name: string): Effect<T, E>;
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
    zoned(zone) {
      return { ...this, zone };
    },
    access(key) {
      const self = this;
      return effect({
        kind: "Access",
        init(env) {
          return U.memo(() => {
            return U.thenOk(
              U.all(env.getRunner(self)(), env.resolve(key)),
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

/** The effect-specific runtime behavior */
export type EffectInit<T = any, E extends Error = Error> = (
  this: Effect<T, E>,
  env: Env,
) => () => unknown;

/** Extract the resolved value type of an effect */
export type T<U> = U extends Effect<infer T> ? T : Exclude<Awaited<U>, Error>;
/** Extract the rejected error type of an effect */
export type E<U> = U extends Effect<any, infer E> ? E : never;

export type $<T> = T | Effect<T>;

/** Determine whether a value is an Effect */
export function isEffect(inQuestion: unknown): inQuestion is Effect {
  return typeof inQuestion === "object"
    && inQuestion !== null
    && effect_ in inQuestion;
}

/**
 * Visit the unique nodes of the effect tree
 * @param root the root of the visitation target tree
 * @param visit the visitor fn, which should return `visitEffect.proceed` in order to proceed with subsequent visitations
 */
export function visitEffect(
  root: Effect,
  visit: (current: Effect) => undefined | typeof visitEffect.proceed,
) {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop()!;
    if (visit(current) === visitEffect.proceed && current.args) {
      for (const arg of current.args) {
        isEffect(arg) && stack.push(arg);
      }
    }
  }
}
/** Cues for effect visitation */
export namespace visitEffect {
  /** Value to return from within a `visitEffect` visitor to continue visitation */
  export const proceed = Symbol();
}

// TODO: should this include custom inspection as well?
class Ref {
  constructor(readonly to: number) {}
}
function inspectEffect(this: Effect, inspect: Inspect): string {
  let i = 0;
  const lookup: Record<string, [i: number, source: Effect]> = {};
  const segments: InspectEffectSegment[] = [];
  visitEffect(this, (current) => {
    if (lookup[current.id]) return;
    lookup[current.id] = [++i, current];
    return visitEffect.proceed;
  });
  for (const id in lookup) {
    const [currentI, { kind, zone, args }] = lookup[id]!;
    segments.unshift({
      i: i - currentI,
      kind,
      ...zone && { zone },
      ...args?.length && {
        args: args.map((arg) => {
          return isEffect(arg) ? new Ref(lookup[arg.id]![0] - 2) : arg;
        }),
      },
    });
  }
  return inspect(segments);
}

type Inspect = (value: unknown) => string;
type DenoInspect = (
  inspect: (value: unknown, opts: Deno.InspectOptions) => string,
  opts: Deno.InspectOptions,
) => string;
type NodeInspect = (_0: unknown, _1: unknown, inspect: Inspect) => string;

interface InspectEffectSegment {
  i: number;
  kind: string;
  zone?: string;
  args?: unknown[];
}
