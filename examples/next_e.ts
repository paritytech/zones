import * as Z from "../mod.ts";

const a = Z.call(() => {
  console.log("A");
});
const b = Z.call(() => {
  console.log("B");
});
const c = Z.call(() => {
  console.log("C");
});
a
  .nextE(b)
  .nextE(c)
  .run();
