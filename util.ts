export interface MapLike<K, V> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}
