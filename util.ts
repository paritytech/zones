export interface MapLike<K, V> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}

export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;

// TODO: delete if unused
export type ValueOf<T> = T[keyof T];

export function identity<T>(val: T): T {
  return val;
}

export function throwIfError<T>(value: T): Exclude<T, Error> {
  if (value instanceof Error) {
    throw value;
  }
  return value as Exclude<T, Error>;
}
