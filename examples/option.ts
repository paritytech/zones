import * as Z from "../mod.ts";

declare const aV: Z.Effect<undefined | string>;
const a = Z.option(aV, () => {
  return "HELLO"!;
});

declare const bV: Z.Effect<undefined | string>;
const b = Z.option(bV, (s) => {
  return [s];
});
