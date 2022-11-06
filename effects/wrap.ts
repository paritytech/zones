import { $, E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

/** Wrap the result of this effect in an object of the specified key */
export function wrap<Target, Key extends $<PropertyKey>>(
  target: Target,
  key: Key,
): Effect<{ [_ in T<Key>]: T<Target> }, E<Target>> {
  return effect({
    kind: "Wrap",
    init(env) {
      return U.memo(() => {
        return U.thenOk(
          U.all(env.resolve(target), env.resolve(key)),
          ([target, key]) => ({ [key]: target }),
        );
      });
    },
    args: [target, key],
  });
}
