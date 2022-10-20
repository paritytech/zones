import { Effect, EffectId, EffectLike, isEffectLike, Name } from "./Effect.ts";
import { isPlaceholder } from "./Placeholder.ts";

export class Process extends Map<EffectId, () => unknown> {
  #context = new WeakMap<new() => unknown, unknown>();

  constructor(private applies: Record<PropertyKey, unknown>) {
    super();
  }

  init = (root: EffectLike) => {
    const stack: EffectLike[] = [root];
    while (stack.length) {
      const currentSource = stack.pop()!;
      if (currentSource instanceof Name) {
        stack.push(currentSource.root);
        continue;
      } else {
        let run = this.get(currentSource.id);
        if (!run) {
          run = currentSource.run(this);
          this.set(currentSource.id, run);
          currentSource.args?.forEach((arg) => {
            if (isEffectLike(arg)) {
              stack.push(arg);
            }
          });
        }
      }
    }
    return this.get(root.id)!;
  };

  run = (effect: EffectLike) => {
    return this.get(effect.id)!;
  };

  resolve = (x: unknown) => {
    return isEffectLike(x)
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
