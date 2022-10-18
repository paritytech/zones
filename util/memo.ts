export function memo<T>(fn: () => T): () => T {
  let result: T;
  return () => {
    if (!result) {
      result = fn();
    }
    return result;
  };
}
