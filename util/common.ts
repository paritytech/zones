export interface MapLike<K, V> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}

export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;

export type AssertIsO<T> = T extends Record<PropertyKey, unknown> ? T : never;
export type AssertKeyof<T, K> = K extends keyof T ? K : never;

// TODO: delete if unused
export type ValueOf<T> = T[keyof T];

export function identity<T>(val: T): T {
  return val;
}
