import { $, E, Effect, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function sel<Target extends $<object>, Key extends $<keyof T<Target>>>(
  target: Target,
  key: Key,
): Effect<
  T<Target>[T<Key> extends keyof T<Target> ? T<Key> : never],
  E<Target>,
  V<Target>
> {
  return new Effect("Sel", (process) => {
    return U.memo(() => {
      return U.thenOk(
        U.all(process.resolve(target), process.resolve(key)),
        ([target, key]) => target[key],
      );
    });
  }, [target, key]);
}
