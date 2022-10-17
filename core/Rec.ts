import { $, E, Effect, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
  // TODO: should the V be U2Ied?
): Effect<RecT<Fields>, E<Fields[keyof Fields]>, V<Fields[keyof Fields]>> {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  return new Effect("Rec", (process) => {
    return U.memo(() => {
      return U.thenOk(
        U.all(...Object.values(fields).map(process.resolve)),
        (values) => {
          return keys.reduce((acc, cur, i) => {
            return {
              ...acc,
              [cur]: values[i]!,
            };
          }, {});
        },
      );
    });
  }, [keys, values]);
}

export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};
