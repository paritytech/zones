import { isEffectLike } from "../Effect.ts";
import * as U from "../util/mod.ts";

class IdFactory<T> {
  #i = 0;

  constructor(
    readonly type: string,
    readonly container: U.MapLike<T, string>,
  ) {}

  of = (target: T): string => {
    let signature = this.container.get(target);
    if (!signature) {
      signature = `${this.type}(${this.#i++})`;
      this.container.set(target, signature);
    }
    return signature;
  };
}

export const strongContainer = new Map();
export const strong = new IdFactory("strong", strongContainer);
export const weak = new IdFactory("weak", new WeakMap());

export function of(target: unknown): string {
  switch (typeof target) {
    case "function": {
      if (!target.name) {
        return weak.of(target as (...args: any[]) => any);
      }
      return `fn(${target.name})`;
    }
    case "object": {
      if (isEffectLike(target)) {
        return target.id;
      } else if (target === null) {
        return "null";
      }
      return weak.of(target);
    }
    default: {
      return strong.of(target);
    }
  }
}
