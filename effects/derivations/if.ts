import { $, Effect } from "../../Effect.ts";
import { derive } from "./base.ts";

function if_<
  Condition extends $<boolean>,
  Then extends Effect,
  Else extends Effect,
>(
  condition: Condition,
  then: Then,
  else_: Else = undefined!,
) {
  return derive(condition, (condition) => {
    return condition ? then : else_;
  })
    .zoned("If");
}
Object.defineProperty(if_, "name", {
  value: "if",
  writable: false,
});
export { if_ as if };
