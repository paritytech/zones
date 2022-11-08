import * as Z from "../mod.ts";

// @ts-expect-error ensuring no definitively-nullish allowed
const _a = Z.option(null, () => {});
// @ts-expect-error ensuring no definitively-nullish allowed
const _b = Z.option(Z.lift(undefined), () => {});

const c = Z.option(null as null | string, (s) => {
  return s;
});
const d = Z.option("HELLO_D" as null | string, (s) => {
  return s;
});
const e = Z.option(Z.lift("HELLO_E"), (s) => {
  return s;
});
console.log(Z.ls(c, d, e).run());
