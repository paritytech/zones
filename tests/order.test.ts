import * as Z from "../mod.ts";
import { noop } from "../util.ts";

Deno.test("sync2", () => {
  const trace = Z.trace();
  const run = Z.run({ hooks: [trace] });
  const a0 = Z.atom([], noop, noop);
  const a1 = Z.atom([a0], noop, noop);
  const a2 = Z.atom([a1], noop, noop);
  run(a2);
  Z.assertTrace(
    trace,
    Z.trace()
      .enter(a0, undefined)
      .enter(a1, undefined)
      .exit(a0)
      .enter(a2, undefined)
      .exit(a1)
      .exit(a2),
  );
});
