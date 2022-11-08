import { E, Effect, T } from "../Effect.ts";
import { env } from "../Env.ts";

/** Ensure that the argument is an effect */
export function lift<V>(value: V): Effect<T<V>, E<V>> {
  return value instanceof Effect ? value : new Effect({
    kind: "Lift",
    impl: (env_) => () => value === env ? env_ : value,
    items: [value],
  });
}
