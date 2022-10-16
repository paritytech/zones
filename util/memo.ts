export function memo(fn: () => unknown) {
  let result: unknown;
  return () => {
    if (!result) {
      result = fn();
    }
    return result;
  };
}
