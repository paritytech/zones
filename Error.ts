import { Effect } from "./Effect.ts";

export class ZonesError<Name extends string> extends Error {
  override readonly name: `Zones${Name}Error`;
  constructor(name: Name, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = `Zones${name}Error`;
  }
}

export class ZonesUntypedError extends ZonesError<"Untyped"> {
  static readonly MESSAGE =
    "An untyped throw occurred within an effect-specific implementation";
  constructor(
    readonly source: Effect,
    readonly thrown: unknown,
  ) {
    super("Untyped", ZonesUntypedError.MESSAGE, {
      cause: { source, thrown },
    });
  }
}

export function thrownAsUntypedError<F extends (...args: any[]) => unknown>(
  source: Effect,
  run: F,
): F & ((...args: any) => ReturnType<F> | ZonesUntypedError) {
  return ((...args: unknown[]) => {
    try {
      const runResult = run(...args);
      if (runResult instanceof Promise) {
        return (async () => {
          try {
            return await runResult;
          } catch (e) {
            return new ZonesUntypedError(source, e);
          }
        })();
      }
      return runResult;
    } catch (e) {
      return new ZonesUntypedError(source, e);
    }
  }) as F & ((...args: any) => ReturnType<F> | ZonesUntypedError);
}
