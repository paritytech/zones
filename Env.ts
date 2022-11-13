import { getOrInit } from "./util/mod.ts"

export interface EnvProps {}

export class Env {
  constructor(readonly props?: EnvProps) {}

  states: Record<string, WeakMap<new() => any, any>> = {}

  state<T>(key: string, container: new() => T): T {
    let state = this.states[key]
    if (!state) {
      state = new WeakMap()
      this.states[key] = state
    }
    return getOrInit(state, container, () => new container())
  }
}
