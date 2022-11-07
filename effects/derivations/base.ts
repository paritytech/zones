import { E, Effect, T } from "../../Effect.ts";
import { wrapThrows } from "../../Error.ts";
import * as U from "../../util/mod.ts";

export function derive<From, IntoR extends Effect>(
  from: From,
  into: DeriveInto<From, IntoR>,
): Effect<T<IntoR>, E<From | IntoR>> {
  return new Effect({
    kind: "Derive",
    init(env) {
      return () => {
        return U.thenOk(
          U.then(env.resolve(from), wrapThrows(into, this)),
          (e) => env.init(e)(),
        );
      };
    },
    items: [from, into],
  });
}

export type DeriveInto<Target, IntoR extends Effect> = (
  resolved: T<Target>,
) => IntoR;
