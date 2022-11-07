import { Env } from "./Env.ts";
import * as U from "./util/mod.ts";

const effect_ = Symbol();

declare const T_: unique symbol;
declare const E_: unique symbol;

export interface EffectPhantoms<T, E extends Error> {
  /** The ok result type */
  readonly [T_]: T;
  /** The error result type */
  readonly [E_]: E;
}

/** Props required by the `effect` factory */
export interface EffectProps<T, E extends Error> {
  readonly [effect_]?: EffectPhantoms<T, E>;
  /** A human-readable name for this type of effect */
  readonly kind: string;
  /** The effect-specific runtime behavior */
  readonly init: EffectInit;
  /** Any arguments (such as child effects) used in the construction this effect */
  readonly args?: unknown[];
}

/** A typed representation of some computation */
export class Effect<T = any, E extends Error = Error>
  implements EffectProps<T, E>, U.CustomInspects
{
  declare [effect_]: EffectPhantoms<T, E>;
  /** An id, which encapsulates any child/argument ids */
  readonly id: string;

  /** If defined, `zone` may indicate a serialization boundary */
  declare zone?: string;

  readonly kind;
  readonly args;
  readonly init;

  constructor({ kind, args, init }: EffectProps<T, E>) {
    this.id = `${kind}(${args?.map(U.id).join(",") || ""})`;
    this.kind = kind;
    this.args = args;
    this.init = init;
  }

  [U.denoCustomInspect] = U.denoCustomInspectDelegate;
  [U.nodeCustomInspect] = U.nodeCustomInspectDelegate;
  inspect = inspectEffect;

  /** Produce a run fn bound to a specific env */
  bind: EffectBind<T, E> = (env) => {
    return env.init(this) as any;
  };

  /** Execute the current effect with either an anonymous (temporary) env */
  run: EffectRun<T, E> = () => {
    return this.bind(new Env())();
  };

  /** Produce a new effect with the specified zone name */
  zoned = (name: string): Effect<T, E> => {
    const clone = new Effect(this);
    clone.zone = name;
    return clone;
  };

  /** Utility method to create a new effect that runs the current effect and indexes into its result */
  access<Key extends $<keyof T>>(
    key: Key,
  ): Effect<T[U.AssertKeyof<T, T_<Key>>], E> {
    const self = this;
    return new Effect({
      kind: "Access",
      init(env) {
        return U.memo(() => {
          return U.thenOk(
            U.all(env.getRunner(self)(), env.resolve(key)),
            ([self, key]) => self[key],
          );
        });
      },
      args: [self, key],
    });
  }

  /** Wrap the result of this effect in an object of the specified key */
  wrap<Key extends $<PropertyKey>>(
    key: Key,
  ): Effect<{ [_ in T_<Key>]: T_<T> }, E> {
    const self = this;
    return new Effect({
      kind: "Wrap",
      init(env) {
        return U.memo(() => {
          return U.thenOk(
            U.all(env.resolve(self), env.resolve(key)),
            ([self, key]) => ({ [key]: self }),
          );
        });
      },
      args: [self, key],
    });
  }

  /** Override `T` */
  as<U extends T>(): Effect<U, E> {
    return this as any;
  }

  /** Exclude members of `E` */
  excludeErr<S extends E>(): Effect<T, Exclude<E, S>> {
    return this as any;
  }
}

/** The effect-specific runtime behavior */
export type EffectInit = (this: Effect, env: Env) => () => unknown;

/** Produce a run fn, bound to the specified env */
export type EffectBind<T, E extends Error = Error> = (
  env: Env,
) => EffectRun<T, E>;

/** The method with which one executes an effect */
export type EffectRun<T, E extends Error> = () => Promise<T | E>;

/** Extract the resolved value type of an effect */
export type T<U> = U extends Effect<infer T> ? T : Exclude<Awaited<U>, Error>;
// Re-aliased for use within `Effect` class def without name conflict
type T_<U> = T<U>;
/** Extract the rejected error type of an effect */
export type E<U> = U extends Effect<any, infer E> ? E : never;

export type $<T> = T | Effect<T>;

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
        arg instanceof Effect && stack.push(arg);
      }
    }
  }
}
/** Cues for effect visitation */
export namespace visitEffect {
  /** Value to return from within a `visitEffect` visitor to continue visitation */
  export const proceed = Symbol();
}

// TODO: inline segments referenced once
function inspectEffect(this: Effect, inspect: U.Inspect): string {
  let i = 0;
  const lookup: Record<string, [i: number, source: Effect]> = {};
  const segments: InspectEffectSegment[] = [];
  visitEffect(this, (current) => {
    if (lookup[current.id]) return;
    lookup[current.id] = [i++, current];
    return visitEffect.proceed;
  });
  for (const id in lookup) {
    const [i, { kind, zone, args }] = lookup[id]!;
    segments.push({
      i,
      kind,
      ...zone && { zone },
      ...args?.length && {
        args: args.map((arg) => {
          return arg instanceof Effect ? new Ref(lookup[arg.id]![0]) : arg;
        }),
      },
    });
  }
  return inspect(segments);
}
interface InspectEffectSegment {
  i: number;
  kind: string;
  zone?: string;
  args?: unknown[];
}
// TODO: should this include custom inspection as well?
class Ref {
  constructor(readonly to: number) {}
}
