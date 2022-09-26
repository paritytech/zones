import * as asserts from "../deps/std/testing/asserts.ts";
import * as Z from "../mod.ts";
import { noop } from "../util.ts";

Deno.test("sync2", () => {
  const trace = Z.trace();
  const run = Z.runtime({ hooks: [trace] });
  const a0 = Z.atom([], noop, () => {});
  const a1 = Z.atom([a0], noop, () => new Error());
  const a2 = Z.atom([a1], noop, () => {});
  run(a2);
  Z.assertTrace(
    trace,
    Z.traceDesc()
      .enter(a0, (r) => asserts.assertEquals(r, undefined))
      .enter(a1, (r) => asserts.assertEquals(r, undefined))
      .exit(a0, (r) => asserts.assertEquals(r, undefined))
      .enter(a2, (r) => asserts.assertEquals(r, undefined))
      .exit(a1, (r) => asserts.assertInstanceOf(r, Error)),
  );
});
