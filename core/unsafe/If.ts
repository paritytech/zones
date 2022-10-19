import { $, EffectLike } from "../../Effect.ts";
import { derive } from "./Derive.ts";

function if_<
  Condition extends $<boolean>,
  Then extends EffectLike,
  Else extends EffectLike,
>(
  condition: Condition,
  then: Then,
  else_: Else = undefined!,
) {
  return derive(condition, (condition) => {
    return condition ? then : else_;
  });
}
Object.defineProperty(if_, "name", {
  value: "if",
  writable: false,
});
export { if_ as if };
