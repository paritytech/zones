import * as Z from "../mod.ts";
import { noop } from "../util.ts";

Deno.test("sync2", () => {
  const trace = Z.trace();
  const run = Z.run({ hooks: [trace] });
  const a0 = Z.atom([], noop, () => err1);
  const a1 = Z.atom([a0], noop, () => err2);
  const a2 = Z.atom([a1], noop, () => {});
  run(a2);
  Z.assertTrace(
    trace,
    Z.trace()
      .enter(a0, undefined)
      .enter(a1, undefined)
      .exit(a0, err1)
      .enter(a2, undefined)
      .exit(a1, err2)
      .exit(a2),
  );
});

const err1 = new Error();
const err2 = new Error();
