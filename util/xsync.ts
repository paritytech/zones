export function then<T, R>(
  val: T,
  cb: (valResolved: Awaited<T>) => R,
): XSync<T, R> {
  return (val instanceof Promise
    ? val.then(cb)
    : cb(val as Awaited<T>)) as XSync<T, R>;
}

export type XSync<Dep, Inner> = unknown extends Dep ? Inner | Promise<Inner>
  : Dep extends Promise<any> ? Promise<Inner>
  : Inner;

const isError = <T>(inQuestion: T): inQuestion is Extract<T, Error> => {
  return inQuestion instanceof Error;
};

export function thenOk<T, R>(
  val: T,
  cb: (okResolved: Exclude<Awaited<T>, Error>) => R,
) {
  return then(val, (x) => {
    return isError(x) ? x : cb(x as Exclude<Awaited<T>, Error>);
  });
}

export function thenErr<T, R>(
  val: T,
  cb: (errResolved: Extract<Awaited<T>, Error>) => R,
) {
  return then(val, (x) => {
    return isError(x) ? cb(x as Extract<Awaited<T>, Error>) : x;
  });
}

export function all<T>(...elements: T[]) {
  const elementsPending: Promise<void>[] = [];
  const elementsResolved = new Array(elements.length);
  let errorContainer: undefined | { instance: Error; i: number };
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    const maybePending = then(element, (resolved) => {
      if (resolved instanceof Error) {
        // We ensure ordered errors for determinism
        if (!errorContainer || errorContainer.i > i) {
          errorContainer = { instance: resolved, i };
        }
      } else {
        elementsResolved[i] = resolved;
      }
    });
    if (maybePending instanceof Promise) {
      elementsPending.push(maybePending);
    }
  }
  return then(elementsPending.length ? Promise.all(elementsPending) : 0, () => {
    return errorContainer?.instance || elementsResolved;
  });
}
