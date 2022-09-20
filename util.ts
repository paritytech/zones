export interface MapLike<K, V> {
  set(key: K, value: V): void;
  has(key: K): boolean;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}

export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;

export function noop() {}

export const uninitialized = Symbol();
export type uninitialized = typeof uninitialized;

export class TinyGraph<T> extends Map<T, Set<T>> {
  pointTo = (from: T, to: T) => {
    const arrows = this.get(from);
    if (arrows) {
      arrows.add(to);
    } else {
      this.set(from, new Set([to]));
    }
  };
}
