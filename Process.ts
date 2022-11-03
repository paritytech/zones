import { Effect, isEffect } from "./Effect.ts";
import { isPlaceholder } from "./Placeholder.ts";

export class Process extends Map<string, () => unknown> {
  #context = new WeakMap<new() => unknown, unknown>();

  constructor(private applies: Record<PropertyKey, unknown>) {
    super();
  }

  init = (root: Effect) => {
    const stack: Effect[] = [root];
    while (stack.length) {
      const currentSource = stack.pop()!;
      let run = this.get(currentSource.id);
      if (!run) {
        run = currentSource.run(this);
        this.set(currentSource.id, run);
        currentSource.args?.forEach((arg) => {
          if (isEffect(arg)) {
            stack.push(arg);
          }
        });
      }
    }
    return this.get(root.id)!;
  };

  run = (effect: Effect) => {
    return this.get(effect.id)!;
  };

  resolve = (x: unknown) => {
    return isEffect(x)
      ? this.run(x)!()
      : isPlaceholder(x)
      ? this.applies[x.key]
      : x;
  };

  context = <T>(ctor: new() => T): T => {
    let instance = this.#context.get(ctor) as undefined | T;
    if (!instance) {
      instance = new ctor();
      this.#context.set(ctor, instance);
    }
    return instance;
  };
}
