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
