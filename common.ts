import { identity } from "./util.ts";

export type ExitResult = void | Error | Promise<void | Error>;

/** Kind of like a `Promise`'s `then`, except that that it respects sync results */
export function then<T, OR = void, ER = void>(
  result: T,
  useOk: (x: Exclude<Awaited<T>, Error>) => OR = identity as any,
  useErr: (x: Extract<Awaited<T>, Error>) => ER = identity as any,
): MatchResultResult<T, OR, ER> {
  return (result instanceof Error)
    ? useErr(result as any)
    : result instanceof Promise
    ? result.then((v) => (v instanceof Error ? useErr : useOk)(v))
    : useOk(result as any) as any;
}
export type MatchResultResult<T, OR, ER> = T extends Promise<any>
  ? Promise<Awaited<OR | ER>>
  : OR | ER;

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
