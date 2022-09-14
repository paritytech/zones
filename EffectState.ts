import { AnyEffect, EffectId } from "./Effect.ts";
import { Context } from "./Runtime.ts";

export abstract class EffectState<Source extends AnyEffect = AnyEffect> {
  dependents?: Set<EffectId>;
  dependencies?: Set<EffectId>;

  constructor(
    readonly context: Context,
    readonly source: Source,
  ) {}

  abstract run: () => unknown;

  addDependent = (dependentId: EffectId): void => {
    if (this.dependents) {
      this.dependents.add(dependentId);
    } else {
      this.dependents = new Set([dependentId]);
    }
  };
}
