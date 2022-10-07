const placeholder_ = Symbol();
const placeholderApplied_ = Symbol();

export function placeholder<T>() {
  return <Key extends PropertyKey>(key: Key): Placeholder<Key, T> => {
    return Object.assign((value: T) => {
      return {
        [placeholderApplied_]: true,
        key,
        value,
      };
    }, {
      [placeholder_]: true,
      key,
    }) as Placeholder<Key, T>;
  };
}
export { placeholder as _ };

export interface Placeholder<
  Key extends PropertyKey = PropertyKey,
  T = any,
> {
  [placeholder_]: true;
  key: Key;
  (value: T): PlaceholderApplied<Key, T>;
}
export interface PlaceholderApplied<
  Key extends PropertyKey = PropertyKey,
  T = any,
> {
  [placeholderApplied_]: true;
  key: Key;
  value: T;
}

export function isPlaceholder(
  inQuestion: unknown,
): inQuestion is Placeholder {
  return typeof inQuestion === "function" && placeholder_ in inQuestion;
}
