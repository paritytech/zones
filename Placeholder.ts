import * as U from "./util/common.ts";

const placeholder_ = Symbol();

export function _<T>() {
  return <Key extends PropertyKey>(key: Key): Placeholder<Key, T> => {
    const placeholder = Object.assign((value: T) => {
      return { placeholder, value };
    }, { [placeholder_]: true as const, key });
    return placeholder as any;
  };
}

export interface Placeholder<Key extends PropertyKey = PropertyKey, T = any> {
  [placeholder_]: true;
  key: Key;
  (value: T): PlaceholderApplied<this>;
}

export function isPlaceholder(
  inQuestion: unknown,
): inQuestion is Placeholder {
  return typeof inQuestion === "function" && placeholder_ in inQuestion;
}

export interface PlaceholderApplied<P extends Placeholder = Placeholder> {
  placeholder: P;
  value: ReturnType<P>;
}

export function flattenApplies<A extends PlaceholderApplied[]>(
  ...applies: A
): FlattenApplies<A[number]> {
  return applies.reduce<Partial<FlattenApplies<A[number]>>>((acc, cur) => {
    return {
      ...acc,
      [cur.placeholder.key]: cur.value,
    };
  }, {}) as FlattenApplies<A[number]>;
}
export type FlattenApplies<A extends PlaceholderApplied> = {
  [K in A["placeholder"]["key"]]: A["value"];
};

/**
 * Appears as constraint in place of supplied `PlaceholderApplied` if there is more
 * than one of a specific placeholder's application in the applied collection
 */
export interface SoleApply {
  [soleApply_]: true;
}
declare const soleApply_: unique symbol;

export type EnsureSoleApplies<
  Applies extends PlaceholderApplied[],
  SecondaryKey extends PropertyKey = never,
> = {
  [K in keyof Applies]: Applies[K]["placeholder"]["key"] extends SecondaryKey
    ? SoleApply
    : K extends _0<Applies> ? Applies[K]
    : SoleApply;
};

/** Produces a union of non-duplicated placeholder keys */
type _0<T extends PlaceholderApplied[]> = Parameters<
  _1<
    U.ValueOf<
      U.U2I<
        U.ValueOf<
          {
            [K in keyof T as K extends `${number}` ? K : never]: T[K] extends
              PlaceholderApplied<Placeholder<infer PK>>
              ? { [_ in PK]: (key: K) => void }
              : never;
          }
        >
      >
    >
  >
>[0];
type _1<T> = T extends ((i: any) => void) ? T : never;
