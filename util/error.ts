export function throwIfError<T>(value: T): Exclude<T, Error> {
  if (value instanceof Error) {
    throw value;
  }
  return value as Exclude<T, Error>;
}

export type ExitResult = void | Error | Promise<void | Error>;

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

export function thrownAsUntypedError<F extends (...args: any[]) => unknown>(
  run: F,
): F & ((...args: any) => ReturnType<F> | UntypedError) {
  return ((...args: unknown[]) => {
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
  }) as F & ((...args: any) => ReturnType<F> | UntypedError);
}
