import { E, Effect, effect, T } from "../../Effect.ts";
import { wrapThrows } from "../../Error.ts";
import * as U from "../../util/mod.ts";

export function derive<From, IntoR extends Effect>(
  from: From,
  into: DeriveInto<From, IntoR>,
): Effect<T<IntoR>, E<From | IntoR>> {
  return effect({
    kind: "Derive",
    init(env) {
      return () => {
        return U.thenOk(
          U.then(env.resolve(from), wrapThrows(this, into)),
          (e) => env.init(e)(),
        );
      };
    },
    args: [from, into],
  });
}

export type DeriveInto<Target, IntoR extends Effect> = (
  resolved: T<Target>,
) => IntoR;
