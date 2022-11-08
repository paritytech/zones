import { $, E, Effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

/** Create an effect that resolves to the value-resolved equivalent of `fields` */
export function rec<Fields extends Record<PropertyKey, unknown>>(
  fields: Fields,
): Effect<RecT<Fields>, E<Fields[keyof Fields]>> {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  return new Effect({
    kind: "Rec",
    impl(env) {
      return () => {
        return U.thenOk(U.all(...values.map(env.resolve)), (values) => {
          return keys.reduce((acc, cur, i) => {
            return { ...acc, [cur]: values[i]! };
          }, {});
        });
      };
    },
    items: [...keys, ...values],
    memoize: true,
  });
}

/** Map a record's value types into their `$` counterparts (maybe effects) */
export type Rec$<Fields> = { [K in keyof Fields]: $<Fields[K]> };
/** Map a record's value types into their `T` counterparts (resolved) */
export type RecT<Fields extends Record<PropertyKey, unknown>> = {
  [K in keyof Fields]: T<Fields[K]>;
};

/**
 * A convenience utility to avoid accidentally narrowing in cases of generic property access.
 * Consider the following example.
 *
 * ```ts
 * interface Y {
 *   a: number;
 *   b: string;
 * }
 *
 * function acceptsY<Y_ extends Rec$<Y>>(y: Y_) {
 *   y.a; // signature is `$<number>`
 *   const y2 = y as Rec$Access<Y_>;
 *   y2.a; // signature is `Y_["a"]`
 * }
 * ```
 */
export type Rec$Access<T extends Record<PropertyKey, unknown>> = {
  [K in keyof T]: T[K];
};
