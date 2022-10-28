import * as Z from "../mod.ts";

const x = Z.call(0, () => {
  return {
    a: "A",
    b: 3,
    c: true,
  } as const;
});

const y = x.access("b");

const result = Z.runtime()(y);

console.log(result);
