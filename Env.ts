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

declare const envFactory_: unique symbol;
/** Branded type to nominally-represent `env` within the type system */
export interface EnvFactory {
  [envFactory_]: true;
  (props?: EnvProps): Env;
}
/** Construct a new execution environment */
export const env = ((props) => new Env(props)) as EnvFactory;

// TODO: LRU-ify
/** The container for past runs, ids and other state */
export class Env {
  runners: Record<string, EffectImplBound> = {};
  vars: Record<string, Map<new() => unknown, unknown>> = {};

  constructor(readonly props?: EnvProps) {}

  /** Initialize an effect root (aka., id all of its unique children) */
  init = (root: Effect) => {
    this.props?.hooks?.beforeInit?.apply(this);
    visitEffect(root, (current) => {
      if (!this.runners[current.id]) {
        const runner = current.impl(this);
        this.runners[current.id] =
          current.memoize === undefined || current.memoize
            ? U.memo(runner)
            : runner;
      }
      return visitEffect.proceed;
    });
    this.props?.hooks?.afterInit?.apply(this);
    return this.runners[root.id]!;
  };

  /** Retrieving the runner of a given effect */
  getRunner = (effect: Effect) => {
    return this.runners[effect.id]!;
  };

  /** Return the value of––if it is an effect––its resolution */
  resolve = (value: unknown) => {
    return value instanceof Effect
      ? this.getRunner(value)()
      : value === env
      ? this
      : value;
  };

  /** Define or access state, unique to the specified key and constructor */
  var = <T>(key: string, ctor: new() => T): T => {
    let state = this.vars[key];
    if (!state) {
      state = new Map();
      this.vars[key] = state;
    }
    return U.getOrInit(state, ctor, () => new ctor()) as T;
  };
}
