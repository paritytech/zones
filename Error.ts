import { Effect } from "./Effect.ts";

export class ZonesError<Name extends string> extends Error {
  override readonly name: `${Name}RuneError`;
  constructor(
    name: Name,
    message: string,
  ) {
    super(message);
    this.name = `${name}RuneError`;
  }
}

export class UntypedZonesError extends ZonesError<"Untyped"> {
  constructor(
    readonly source: Effect,
    readonly thrown: unknown,
  ) {
    super(
      "Untyped",
      "An untyped error was thrown from the execution of an effect",
    );
  }
}

export function thrownAsUntypedError<F extends (...args: any[]) => unknown>(
  source: Effect,
  run: F,
): F & ((...args: any) => ReturnType<F> | UntypedZonesError) {
  return ((...args: unknown[]) => {
    try {
      const runResult = run(...args);
      if (runResult instanceof Promise) {
        return (async () => {
          try {
            return await runResult;
          } catch (e) {
            return new UntypedZonesError(source, e);
          }
        })();
      }
      return runResult;
    } catch (e) {
      return new UntypedZonesError(source, e);
    }
  }) as F & ((...args: any) => ReturnType<F> | UntypedZonesError);
}
