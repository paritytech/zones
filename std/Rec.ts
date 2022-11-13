import { E, Effect, Item, T } from "../Effect.ts"
import { collect, mapOk } from "../util/mod.ts"

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Effect<RecT<Fields>, E<Fields[keyof Fields]>> {
  return new Effect({
    kind: "Rec",
    impl(env) {
      const keys = Object.keys(fields)
      const fieldRuns = Object.values(fields).map((key) =>
        Effect.lift(key).impl(env)
      )
      return () =>
        mapOk(
          collect(fieldRuns.map((elementRun) => elementRun())),
          (rCollect) =>
            keys.reduce((acc, cur, i) => ({ ...acc, [cur]: rCollect[i]! }), {}),
        )
    },
    // TODO: items
  })
}

export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>
}

export type RecItem<Fields> = { [K in keyof Fields]: Item<Fields[K]> }

export type RecItemAccess<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: T[K]
}
