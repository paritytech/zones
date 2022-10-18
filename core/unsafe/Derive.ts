import { E, Effect, EffectLike, T, V } from "../../Effect.ts";
import { thrownAsUntypedError } from "../../Error.ts";
import * as U from "../../util/mod.ts";

export function derive<Target, UseResult extends EffectLike>(
  from: Target,
  into: DeriveInto<Target, UseResult>,
): Effect<
  T<Awaited<UseResult>>,
  | E<Target>
  | Extract<Awaited<UseResult>, Error>
  | E<Extract<Awaited<UseResult>, EffectLike>>,
  V<Target> | V<Awaited<UseResult>>
> {
  return new Effect("Derive", (process) => {
    return () => {
      return U.thenOk(
        U.then(process.resolve(from), thrownAsUntypedError(into)),
        (e) => process.init(e)(),
      );
    };
  }, [from, into]);
}

export type DeriveResult = Error | EffectLike | Promise<Error | EffectLike>;

export type DeriveInto<Target, UseR extends DeriveResult> = (
  resolved: T<Target>,
) => UseR;
