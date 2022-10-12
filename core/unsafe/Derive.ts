import { E, Effect, EffectLike, EffectRun, T, V } from "../../Effect.ts";
import * as U from "../../util/mod.ts";

export function derive<Target, UseResult extends EffectLike>(
  from: Target,
  into: DeriveInto<Target, UseResult>,
): Derive<Target, UseResult> {
  return new Derive(from, into);
}

export class Derive<Target = any, UseResult extends EffectLike = EffectLike>
  extends Effect<
    "Derive",
    V<Target> | V<Awaited<UseResult>>,
    | E<Target>
    | Extract<Awaited<UseResult>, Error>
    | E<Extract<Awaited<UseResult>, EffectLike>>,
    T<Awaited<UseResult>>
  >
{
  constructor(
    readonly from: Target,
    readonly into: DeriveInto<Target, UseResult>,
  ) {
    super("Derive", [from, into]);
  }

  enter: EffectRun = ({ process }) => {
    return U.then.ok(
      U.then(
        process.resolve(this.from),
        // TODO: clean up these typings
        U.thrownAsUntypedError(this.into),
      ),
      (e) => process.instate(e as EffectLike).result,
    );
  };
}

export type DeriveResult = Error | EffectLike | Promise<Error | EffectLike>;

export type DeriveInto<Target, UseR extends DeriveResult> = (
  resolved: T<Target>,
) => UseR;
