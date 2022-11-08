import * as Z from "../mod.ts";

const a = Z.option(null as null | string, (s) => {
  return s;
});
const b = Z.option("HELLO_D" as null | string, (s) => {
  return s;
});
const c = Z.option(Z.lift("HELLO_E"), (s) => {
  return s;
});
console.log(Z.ls(a, b, c).run());
