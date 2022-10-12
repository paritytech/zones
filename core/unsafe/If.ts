// TODO: utilize `Derive` under the hood
import { $, E, Effect, EffectRun, T, V } from "../../Effect.ts";

export { if_ as if };
function if_<Condition extends $<boolean>, Then, Else = void>(
  condition: Condition,
  then: Then,
  else_: Else = undefined!,
): If<Condition, Then, Else> {
  return new If(condition, then, else_);
}

export class If<
  Condition extends $<boolean> = $<boolean>,
  Then = any,
  Else = any,
> extends Effect<
  "If",
  V<Condition | Then | Else>,
  E<Condition | Then | Else>,
  T<Then | Else>
> {
  constructor(
    readonly condition: Condition,
    readonly then: Then,
    readonly else_: Else,
  ) {
    super("If", [condition, then, else_]);
  }

  enter: EffectRun = () => {};
}
