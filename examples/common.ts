import * as Z from "../mod.ts";

const trace = Z.trace();

export const { run } = new Z.Runtime({
  hooks: [trace],
});
