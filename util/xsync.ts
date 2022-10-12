export function then<T, R>(
  val: T,
  cb: (valResolved: Awaited<T>) => R,
): XSync<T, R> {
  return (val instanceof Promise
    ? val.then(cb)
    : cb(val as Awaited<T>)) as XSync<T, R>;
}
export namespace then {
  function fromPredicate<X>(
    predicate: (inQuestion: unknown) => inQuestion is X,
  ) {
    return <T, R>(
      val: T,
      cb: (valResolved: Extract<Awaited<T>, X>) => R,
    ): XSync<T, Exclude<Awaited<T>, X> | R> => {
      return then(val, (x) => {
        return predicate(x) ? cb(x as any) : x;
      }) as any;
    };
  }
  const isError = <T>(inQuestion: T): inQuestion is Extract<T, Error> => {
    return inQuestion instanceof Error;
  };
  export const err = fromPredicate(isError);
  const isNotError = <T>(inQuestion: T): inQuestion is Exclude<T, Error> => {
    return !isError(inQuestion);
  };
  export const ok = fromPredicate(isNotError);
}

export type XSync<Dep, Inner> = unknown extends Dep ? Inner | Promise<Inner>
  : Dep extends Promise<any> ? Promise<Inner>
  : Inner;

export function tryForEach<T, R>(
  elements: T[],
  fn: (element: T) => R,
): XSync<R, Awaited<R>[] | Error> {
  const pending: Promise<void>[] = [];
  const elementsResolved = new Array<R>(elements.length);
  let errorContainer: undefined | { instance: Error; i: number };
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    const elementResult = then(fn(element), (resolved) => {
      if (resolved instanceof Error) {
        if (!errorContainer || errorContainer.i > i) {
          errorContainer = { instance: resolved, i };
        }
      } else {
        elementsResolved[i] = resolved;
      }
    });
    if (elementResult instanceof Promise) {
      pending.push(elementResult);
    }
  }
  return then(pending.length ? Promise.all(pending) : undefined, () => {
    return errorContainer?.instance || elementsResolved;
  }) as XSync<R, Awaited<R>[] | Error>;
}
