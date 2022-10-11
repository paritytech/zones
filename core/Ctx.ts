import { E, Effect, EffectRun, V } from "../Effect.ts";

export function ctx<T>(init: () => T) {
  return <Scope>(scope: Scope): Ctx<T, Scope> => {
    return new Ctx(init, scope);
  };
}

export class Ctx<T extends unknown = any, Scope extends unknown = any>
  extends Effect<"Ctx", V<Scope>, E<Scope>, Awaited<T>>
{
  constructor(
    readonly init: () => T,
    readonly scope: Scope,
  ) {
    super("Ctx", [init, scope]);
  }

  enter: EffectRun = () => {
    // TODO: scoping
    return this.init();
  };
}
