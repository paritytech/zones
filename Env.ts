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

export interface Symbol {
  src: Effect;
  bound: EffectImplBound;
}

// TODO: LRU-ify
/** The container for past runs, ids and other state */
export class Env {
  symbols: Record<string, Symbol> = {};
  states: Record<string, Map<new() => unknown, unknown>> = {};

  constructor(readonly props?: EnvProps) {}

  /** Retrieving the symbol corresponding to a given effect */
  symbol = (src: Effect): Symbol => {
    if (!this.symbols[src.id]) {
      this.props?.hooks?.beforeInit?.apply(this);
      visitEffect(src, (current) => {
        if (!this.symbols[current.id]) {
          const runner = current.impl(this);
          this.symbols[current.id] = {
            src: current,
            bound: current.memoize === undefined || current.memoize
              ? U.memo(runner)
              : runner,
          };
        }
        return visitEffect.proceed;
      });
      this.props?.hooks?.afterInit?.apply(this);
    }
    return this.symbols[src.id]!;
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
      ? this.symbol(value).bound()
      : value === env
      ? this
      : value;
  };
}
