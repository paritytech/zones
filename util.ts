import { Atom } from "./Atom.ts";
import { AtomWork } from "./AtomWork.ts";
import { assert } from "./deps/std/testing/asserts.ts";
import { AnyEffect } from "./Effect.ts";
import { Work } from "./Work.ts";

export interface MapLike<K, V> {
  set(key: K, value: V): void;
  has(key: K): boolean;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}

export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;
