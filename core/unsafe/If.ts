// TODO: utilize `Derive` under the hood
import { $, E, Effect, T, V } from "../../Effect.ts";

export { if_ as if };
function if_<Condition extends $<boolean>, Then, Else = void>(
  condition: Condition,
  then: Then,
  else_: Else = undefined!,
): Effect<
  T<Then | Else>,
  E<Condition | Then | Else>,
  V<Condition | Then | Else>
> {
  return new Effect("If", () => {}, [condition, then, else_]);
}
