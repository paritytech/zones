import { E, Effect, EffectLike, EffectState, T, V } from "../../Effect.ts";
import { Process } from "../../Run.ts";

export function derive<Target, UseResult extends EffectLike>(
  target: Target,
  into: DeriveInto<Target, UseResult>,
): Derive<Target, UseResult> {
  return new Derive(target, into);
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

  state = (process: Process): DeriveState => {
    return new DeriveState(process, this);
  };
}

export type DeriveResult = Error | EffectLike | Promise<Error | EffectLike>;

export type DeriveInto<Target, UseR extends DeriveResult> = (
  resolved: T<Target>,
) => UseR;

export class DeriveState extends EffectState<Derive> {
  getResult = () => {};
}
