import { Effect, isEffect } from "./Effect.ts";
import * as U from "./util/mod.ts";

export function env(): Env {
  return new Env();
}

export class Env {
  runners: Record<string, () => unknown> = {};
  globals = new WeakMap<new() => unknown, unknown>();
  states: Record<string, WeakMap<new() => unknown, unknown>> = {};

  init = (root: Effect) => {
    const stack = [root];
    while (stack.length) {
      const currentSource = stack.pop()!;
      let run = this.runners[currentSource.id];
      if (!run) {
        run = currentSource.init(this);
        this.runners[currentSource.id] = run;
        currentSource.args?.forEach((arg) => {
          if (isEffect(arg)) {
            stack.push(arg);
          }
        });
      }
    }
    return this.runners[root.id]!;
  };

  run = (effect: Effect) => {
    return this.runners[effect.id]!;
  };

  resolve = (x: unknown) => {
    return isEffect(x) ? this.run(x)!() : x;
  };

  state = <T>(key: string, ctor: new() => T): T => {
    let state = this.states[key];
    if (!state) {
      state = new WeakMap();
      this.states[key] = state;
    }
    return U.getOrInit(state, ctor, () => new ctor()) as T;
  };

  global = <T>(ctor: new() => T): T => {
    return U.getOrInit(this.globals, ctor, () => new ctor()) as T;
  };
}
