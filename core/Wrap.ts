import { $, E, Effect, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function wrap<Target extends $<object>, Key extends $<string>>(
  target: Target,
  key: Key,
): Effect<{ [_ in T<Key>]: T<Target> }, E<Target>, V<Target>> {
  return new Effect("Wrap", (process) => {
    return U.memo(() => {
      return U.thenOk(
        U.all(process.resolve(target), process.resolve(key)),
        ([target, key]) => ({ [key]: target }),
      );
    });
  }, [target, key]);
}
