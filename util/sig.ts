import { isEffectLike } from "../Effect.ts";
import * as U from "../util/mod.ts";

declare const signature_: unique symbol;
export type Signature = string & { [signature_]?: true };

class SignatureFactory<T> {
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
export const strong = new SignatureFactory("strong", strongContainer);
export const weak = new SignatureFactory("weak", new WeakMap());

export function of(target: unknown): Signature {
  switch (typeof target) {
    case "function": {
      return weak.of(target as (...args: any[]) => any);
    }
    case "object": {
      if (isEffectLike(target)) {
        return target.id;
      } else if (target === null) {
        return "null" as Signature;
      }
      return weak.of(target);
    }
    default: {
      return strong.of(target);
    }
  }
}
