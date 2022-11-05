import { $, E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function wrap<Target extends $<object>, Key extends $<string>>(
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
        ) as any;
      });
    },
    args: [target, key],
  });
}
