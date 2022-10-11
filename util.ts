export interface MapLike<K, V> {
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  delete(key: K): boolean;
}

export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;

// TODO: delete if unused
export type ValueOf<T> = T[keyof T];

export function identity<T>(val: T): T {
  return val;
}

export function throwIfError<T>(value: T): Exclude<T, Error> {
  if (value instanceof Error) {
    throw value;
  }
  return value as Exclude<T, Error>;
}

export type ExitResult = void | Error | Promise<void | Error>;

/** Kind of like a `Promise`'s `then`, except that that it respects sync results */
export function then<T, OR = void, ER = void>(
  result: T,
  useOk: (x: Exclude<Awaited<T>, Error>) => OR = identity as any,
  useErr: (x: Extract<Awaited<T>, Error>) => ER = identity as any,
): SameSync<T, OR | ER> {
  return (result instanceof Error)
    ? useErr(result as any)
    : result instanceof Promise
    ? result.then((v) => (v instanceof Error ? useErr : useOk)(v))
    : useOk(result as any) as any;
}
export type SameSync<T, U> = unknown extends T ? U | Promise<U>
  : T extends Promise<any> ? Promise<U>
  : U;

export class RuneError<Name extends string> extends Error {
  override readonly name: `${Name}RuneError`;
  constructor(
    name: Name,
    message: string,
  ) {
    super(message);
    this.name = `${name}RuneError`;
  }
}

// TODO: clean this up
export function tryForEach<T, R>(
  elements: T[],
  fn: (element: T) => R,
): SameSync<R, R[] | Error> {
  const pending: Promise<void>[] = [];
  const elementsResolved = new Array<R>(elements.length);
  let errorContainer: undefined | { instance: Error; i: number };
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    const elementResult = fn(element);
    if (elementResult instanceof Promise) {
      pending.push(elementResult.then((elementResolved) => {
        if (elementResolved instanceof Error) {
          if (!errorContainer || errorContainer.i > i) {
            errorContainer = { instance: elementResolved, i };
          }
        } else {
          elementsResolved[i] = elementResolved;
        }
      }));
    }
  }
  return then(pending.length ? Promise.all(pending) : undefined, () => {
    return errorContainer?.instance || elementsResolved;
  }) as SameSync<R, R[] | Error>;
}

export class UntypedError extends RuneError<"Untyped"> {
  constructor(readonly thrown: unknown) {
    super("Untyped", "TODO");
  }
}
export function thrownAsUntypedError(run: (...args: any[]) => unknown) {
  return (...args: unknown[]) => {
    try {
      const runResult = run(...args);
      if (runResult instanceof Promise) {
        return (async () => {
          try {
            return await runResult;
          } catch (e) {
            return new UntypedError(e);
          }
        })();
      }
      return runResult;
    } catch (e) {
      return new UntypedError(e);
    }
  };
}
