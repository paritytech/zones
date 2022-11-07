import { E, Effect, T } from "../Effect.ts";

/** Ensure that the argument is an effect */
export function lift<V>(value: V): Effect<T<V>, E<V>> {
  return value instanceof Effect ? value : new Effect({
    kind: "Lift",
    init: () => () => value,
    items: [value],
  });
}
