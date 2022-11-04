import { E, Effect, effect, T } from "../../Effect.ts";
import { thrownAsUntypedError } from "../../Error.ts";
import * as U from "../../util/mod.ts";

export function derive<From, IntoR extends Effect>(
  from: From,
  into: DeriveInto<From, IntoR>,
): Effect<T<IntoR>, E<From | IntoR>> {
  const e = effect({
    kind: "Derive",
    init(env) {
      return (): unknown => {
        return U.thenOk(
          U.then(env.resolve(from), thrownAsUntypedError(e, into)),
          (e) => env.init(e)(),
        );
      };
    },
    args: [from, into],
  });
  return e as any;
}

export type DeriveInto<Target, IntoR extends Effect> = (
  resolved: T<Target>,
) => IntoR;
