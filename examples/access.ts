import * as Z from "../mod.ts";

const result = await Z
  .call(() =>
    ({
      a: "A",
      b: 3,
      c: true,
    }) as const
  )
  .access("b")
  .run();

console.log(result);
