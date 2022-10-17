import { Effect, EffectId, EffectLike, isEffectLike, Name } from "./Effect.ts";
import { isPlaceholder } from "./Placeholder.ts";

export class Process extends Map<EffectId, () => unknown> {
  #context = new Map<new() => unknown, unknown>();

  constructor(private applies: Record<PropertyKey, unknown>) {
    super();
  }

  #ensureRun = (source: Effect) => {
    let run = this.get(source.id);
    if (!run) {
      run = source.run(this);
      this.set(source.id, run);
    }
    return run;
  };

  init = (root: EffectLike) => {
    while (root instanceof Name) {
      root = root.root;
    }
    const stack: EffectLike[] = [];
    const rootRun = this.#ensureRun(root);
    const pushChildren = (current: Effect) => {
      current.args?.forEach((arg) => {
        if (isEffectLike(arg)) {
          stack.push(arg);
        }
      });
    };
    pushChildren(root);
    while (stack.length) {
      const currentSource = stack.pop()!;
      if (currentSource instanceof Name) {
        stack.push(currentSource.root);
        continue;
      } else {
        this.#ensureRun(currentSource);
        pushChildren(currentSource);
      }
    }
    return rootRun;
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
