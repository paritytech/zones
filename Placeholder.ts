import * as U from "./util/common.ts";

const placeholder_ = Symbol();

export function _<T>() {
  return <Key extends PropertyKey>(key: Key): Placeholder<Key, T> => {
    const placeholder: Placeholder<Key, T> = {
      [placeholder_]: true,
      key,
      a: (value: T) => ({ [key]: value }) as Record<Key, T>,
    };
    return placeholder;
  };
}

export interface Placeholder<Key extends PropertyKey = PropertyKey, T = any> {
  [placeholder_]: true;
  key: Key;
  a: (value: T) => Record<Key, T>;
}

export function isPlaceholder(
  inQuestion: unknown,
): inQuestion is Placeholder {
  return !!inQuestion && typeof inQuestion === "object"
    && placeholder_ in inQuestion;
}

/**
 * Appears as constraint in place of supplied `PlaceholderApplied` if there is more
 * than one of a specific placeholder's application in the applied collection
 */
export interface SoleApply {
  [soleApply_]: true;
}
declare const soleApply_: unique symbol;

export type EnsureSoleApplies<
  Applies extends Record<PropertyKey, unknown>[],
  SecondaryKey extends PropertyKey = never,
> = {
  [K in keyof Applies]: keyof Applies[K] extends SecondaryKey ? SoleApply
    : K extends _0<Applies> ? Applies[K]
    : SoleApply;
};

/** Produces a union of non-duplicated placeholder keys */
type _0<T extends Record<PropertyKey, unknown>[]> = Parameters<
  _1<
    U.ValueOf<
      U.U2I<
        U.ValueOf<
          {
            [K in keyof T as K extends `${number}` ? K : never]: T[K] extends
              Record<infer PK, any> ? { [_ in PK]: (key: K) => void }
              : never;
          }
        >
      >
    >
  >
>[0];
type _1<T> = T extends ((i: any) => void) ? T : never;

export function flattenApplies(...applies: Record<PropertyKey, unknown>[]) {
  return applies.reduce((acc, cur) => {
    return {
      ...acc,
      ...cur,
    };
  }, {});
}
