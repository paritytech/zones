import { Effect, visitEffect } from "./Effect.ts";
import * as U from "./util/mod.ts";

// TODO: what other hooks / props may be useful?
/** Props to optionally supply to env */
export interface EnvProps {
  /** Callbacks to trigger at different points in the effect initialization lifecycle */
  hooks?: ThisType<EnvHookContext> & {
    /** Before ingesting an effect into the env */
    beforeInit?: () => void;
    /** After ingesting an effect into the env */
    afterInit?: () => void;
  };
}

/** The context with which hooks execute */
export interface EnvHookContext extends Env {
  currentRoot: Effect;
}

/** Construct a new execution environment */
export function env(props?: EnvProps): Env {
  return new Env(props);
}

/** The container for past runs, ids and other state */
export class Env {
  round = 0;
  runners: Record<string, () => unknown> = {};
  // TODO: Use finalization registry to clean up.
  //       We don't use a weak map bc we may want to inspect values.
  vars: Record<string, Map<new() => unknown, unknown>> = {};

  constructor(readonly props?: EnvProps) {}

  /** Initialize an effect root (aka., id all of its unique children) */
  init = (root: Effect) => {
    const hookCtx: EnvHookContext = { ...this, currentRoot: root };
    this.props?.hooks?.beforeInit?.apply(hookCtx);
    visitEffect(root, (current) => {
      if (this.runners[current.id]) return;
      const runner = current.init(this);
      this.runners[current.id] = current.memoize ? U.memo(runner) : runner;
      return visitEffect.proceed;
    });
    this.props?.hooks?.afterInit?.apply(hookCtx);
    this.round++;
    return this.runners[root.id]!;
  };

  /** Retrieving the runner of a given effect */
  getRunner = (effect: Effect) => {
    return this.runners[effect.id]!;
  };

  /** Return the value of––if it is an effect––its resolution */
  resolve = (x: unknown) => {
    return x instanceof Effect ? this.getRunner(x)!() : x;
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
