import { E, Effect, EffectState, V } from "../Effect.ts";
import { Process } from "../Run.ts";

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

  state = (process: Process): CtxState => {
    return new CtxState(process, this);
  };
}

export class CtxState extends EffectState<Ctx> {
  declare value?: object;

  getResult = (): unknown => {
    if (!("value" in this)) {
      // TODO: scoping
      this.value = this.source.init();
    }
    return this.value;
  };
}
