import { $, E, Effect, effect, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function wrap<Target extends $<object>, Key extends $<string>>(
  target: Target,
  key: Key,
): Effect<{ [_ in T<Key>]: T<Target> }, E<Target>, V<Target>> {
  return effect({
    kind: "Wrap",
    run: (process) => {
      return U.memo(() => {
        return U.thenOk(
          U.all(process.resolve(target), process.resolve(key)),
          ([target, key]) => ({ [key]: target }),
        );
      });
    },
    children: [target, key],
  });
}
