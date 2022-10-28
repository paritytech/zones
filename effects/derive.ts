import { E, Effect, T, V } from "../Effect.ts";
import { thrownAsUntypedError } from "../Error.ts";
import * as U from "../util/mod.ts";

export function derive<From, IntoR extends Effect>(
  from: From,
  into: DeriveInto<From, IntoR>,
): Effect<T<IntoR>, E<From | IntoR>, V<From | IntoR>> {
  const e = new Effect("Derive", (process) => {
    return (): unknown => {
      return U.thenOk(
        U.then(process.resolve(from), thrownAsUntypedError(e, into)),
        (e) => process.init(e)(),
      );
    };
  }, [from, into]);
  return e as any;
}

export type DeriveInto<Target, IntoR extends Effect> = (
  resolved: T<Target>,
) => IntoR;
