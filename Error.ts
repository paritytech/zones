import { Effect } from "./Effect.ts";

export class ZonesError extends Error {
  static MESSAGE =
    "An untyped throw occurred within an effect-specific implementation";
  override readonly name = `ZonesError`;
  constructor(readonly source: Effect, thrown: unknown) {
    super(ZonesError.MESSAGE, { cause: thrown });
  }
}

export function wrapThrows<F extends (...args: any[]) => unknown>(
  source: Effect,
  run: F,
): F & ((...args: any) => ReturnType<F> | ZonesError) {
  return ((...args: unknown[]) => {
    try {
      const runResult = run(...args);
      if (runResult instanceof Promise) {
        return (async () => {
          try {
            return await runResult;
          } catch (thrown) {
            return new ZonesError(source, thrown);
          }
        })();
      }
      return runResult;
    } catch (thrown) {
      return new ZonesError(source, thrown);
    }
  }) as F & ((...args: any) => ReturnType<F> | ZonesError);
}
