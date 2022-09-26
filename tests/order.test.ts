import { assertEquals } from "../deps/std/testing/asserts.ts";
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
    Z.traceDesc()
      .enter(a0, (r) => assertEquals(r, undefined))
      .enter(a1, (r) => assertEquals(r, undefined))
      .exit(a0, (r) => assertEquals(r, err1))
      .enter(a2, (r) => assertEquals(r, undefined))
      .exit(a1, (r) => assertEquals(r, err2))
      .exit(a2, () => {}),
  );
});

const err1 = new Error();
const err2 = new Error();
