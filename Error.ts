import { Effect } from "./Effect.ts";

export class ZonesError<Name extends string> extends Error {
  override readonly name: `${Name}ZonesError`;
  constructor(name: Name, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = `${name}ZonesError`;
  }
}

export class UntypedZonesError extends ZonesError<"Untyped"> {
  static readonly MESSAGE =
    "An untyped throw occurred within an effect-specific implementation";
  constructor(
    readonly source: Effect,
    readonly thrown: unknown,
  ) {
    super("Untyped", UntypedZonesError.MESSAGE, {
      cause: { source, thrown },
    });
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
