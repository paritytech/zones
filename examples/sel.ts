import * as Z from "../mod.ts";

const x = Z.call(0, () => {
  return {
    a: "A",
    b: 3,
    c: true,
  } as const;
});

const y = Z.sel(x, "b");

const result = Z.runtime()(y);

console.log(result);
