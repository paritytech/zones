import { Effect, isEffect, visitEffect } from "./Effect.ts";
import * as U from "./util/mod.ts";

export interface EnvProps {
  hooks?: ThisType<HookContext> & {
    beforeInit?: () => void;
    afterInit?: () => void;
  };
}
export interface HookContext extends Env {
  currentRoot: Effect;
}

export function env(props?: EnvProps): Env {
  return new Env(props);
}

export class Env {
  round = 0;
  runners: Record<string, () => unknown> = {};
  // TODO: Use finalization registry to clean up.
  //       We don't use a weak map bc we may want to inspect values.
  globals = new Map<new() => unknown, unknown>();
  // TODO: rename `states`/`state`?
  states: Record<string, Map<new() => unknown, unknown>> = {};

  constructor(readonly props?: EnvProps) {}

  init = (root: Effect) => {
    const hookCtx: HookContext = { ...this, currentRoot: root };
    this.props?.hooks?.beforeInit?.apply(hookCtx);
    visitEffect(root, (current) => {
      if (this.runners[current.id]) return;
      this.runners[current.id] = current.init(this);
      return visitEffect.proceed;
    });
    this.props?.hooks?.afterInit?.apply(hookCtx);
    this.round++;
    return this.runners[root.id]!;
  };

  getRunner = (effect: Effect) => {
    return this.runners[effect.id]!;
  };

  resolve = (x: unknown) => {
    return isEffect(x) ? this.getRunner(x)!() : x;
  };

  global = <T>(ctor: new() => T): T => {
    return U.getOrInit(this.globals, ctor, () => new ctor()) as T;
  };

  state = <T>(key: string, ctor: new() => T): T => {
    let state = this.states[key];
    if (!state) {
      state = new Map();
      this.states[key] = state;
    }
    return U.getOrInit(state, ctor, () => new ctor()) as T;
  };
}
