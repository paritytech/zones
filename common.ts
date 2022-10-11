import { identity } from "./util.ts";

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

export function tryForEach<T, R>(
  elements: T[],
  fn: (element: T) => R,
): SameSync<R, R[] | Error> {
  const elementsResolved = new Array<R>(elements.length);
  const pending: Promise<void>[] = [];
  let error: undefined | { instance: Error; i: number };
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    const elementResult = fn(element);
    if (elementResult instanceof Promise) {
      pending.push(elementResult.then((elementResolved) => {
        if (elementResolved instanceof Error) {
          if (!error || error.i > i) {
            error = { instance: elementResolved, i };
          }
        } else {
          elementsResolved[i] = elementResolved;
        }
      }));
    }
  }
  return (pending.length
    ? Promise.all(pending).then(() => error?.instance || elementsResolved)
    : error
    ? error.instance
    : elementsResolved) as SameSync<R, R[] | Error>;
}

export class UntypedError extends RuneError<"Untyped"> {
  constructor(readonly thrown: unknown) {
    super("Untyped", "TODO");
  }
}
export function thrownAsUntypedError(run: (...args: unknown[]) => unknown) {
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
