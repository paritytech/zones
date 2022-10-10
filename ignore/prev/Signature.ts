import { isEffectLike } from "./Effect.ts";
import { MapLike } from "./util.ts";

declare const signature_: unique symbol;
export type Signature = string & { [signature_]: true };

class SignatureFactory<T> {
  #i = 0;

  constructor(
    readonly type: string,
    readonly container: MapLike<T, Signature>,
  ) {}

  signature = (target: T): Signature => {
    let signature = this.container.get(target);
    if (!signature) {
      signature = `${this.type}(${this.#i++})` as Signature;
      this.container.set(target, signature);
    }
    return signature;
  };
}

const { signature: ref_ } = new SignatureFactory("ref", new WeakMap());
const { signature: val_ } = new SignatureFactory("val", new Map());

export namespace sig {
  export const ref = ref_;
  export const val = val_;

  export function unknown(target: unknown): Signature {
    switch (typeof target) {
      case "function": {
        return ref(target as (...args: any[]) => any);
      }
      case "object": {
        if (isEffectLike(target)) {
          return target.id;
        } else if (target === null) {
          return "null" as Signature;
        }
        return ref(target);
      }
      default: {
        return val(target);
      }
    }
  }
}
