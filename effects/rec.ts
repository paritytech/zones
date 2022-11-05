import { $, E, Effect, effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Effect<RecT<Fields>, E<Fields[keyof Fields]>> {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  return effect({
    kind: "Rec",
    init(env) {
      return U.memo(() => {
        return U.thenOk(
          U.all(...Object.values(fields).map(env.resolve)),
          (values) => {
            return keys.reduce((acc, cur, i) => {
              return {
                ...acc,
                [cur]: values[i]!,
              };
            }, {});
          },
        ) as any;
      });
    },
    args: [keys, values],
  });
}

export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};

export type Rec$Access<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: T[K];
};
