import * as Z from "../mod.ts";

const result = await Z
  .call(0, () =>
    ({
      a: "A",
      b: 3,
      c: true,
    }) as const)
  .access("b")
  .run();

console.log(result);
