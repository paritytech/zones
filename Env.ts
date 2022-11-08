import { Effect, EffectImplBound, visitEffect } from "./Effect.ts";
import * as U from "./util/mod.ts";

// TODO: what other hooks / props may be useful?
/** Props to optionally supply to env */
export interface EnvProps {
  /** Callbacks to trigger at different points in the effect initialization lifecycle */
  hooks?: ThisType<Env> & {
    /** Before ingesting an effect into the env */
    beforeInit?: () => void;
    /** After ingesting an effect into the env */
    afterInit?: () => void;
  };
}

/** Construct a new execution environment */
export const env = ((props) => new Env(props)) as EnvFactory;
declare const envFactory_: unique symbol;
/** A branded type to nominally-represent `env` within the type system */
export interface EnvFactory {
  [envFactory_]: true;
  (props?: EnvProps): Env;
}

export interface EnvEntry {
  src: Effect;
  bound: EffectImplBound;
}

// TODO: LRU-ify
/** The container for past runs, ids and other state */
export class Env {
  entries: Record<string, EnvEntry> = {};
  states: Record<string, Map<new() => unknown, unknown>> = {};

  constructor(readonly props?: EnvProps) {}

  /** Retrieving the entry corresponding to a given effect */
  entry = (src: Effect): EnvEntry => {
    if (!this.entries[src.id]) {
      this.props?.hooks?.beforeInit?.apply(this);
      visitEffect(src, (current) => {
        if (!this.entries[current.id]) {
          this.entries[current.id] = {
            src: current,
            bound: (current.memoize === undefined || current.memoize
              ? U.memo
              : U.identity)(current.impl(this)),
          };
        }
        return visitEffect.proceed;
      });
      this.props?.hooks?.afterInit?.apply(this);
    }
    return this.entries[src.id]!;
  };

  /** Define or access state, unique to the specified key and constructor */
  state = <T>(key: string, ctor: new() => T): T => {
    let state = this.states[key];
    if (!state) {
      state = new Map();
      this.states[key] = state;
    }
    return U.getOrInit(state, ctor, () => new ctor()) as T;
  };

  /** Return the value of––if it is an effect––its resolution */
  resolve = (value: unknown) => {
    return value instanceof Effect
      ? this.entry(value).bound()
      : value === env
      ? this
      : value;
  };
}
