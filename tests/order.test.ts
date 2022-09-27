import * as asserts from "../deps/std/testing/asserts.ts";
import * as Z from "../mod.ts";

Deno.test("Order", async (t) => {
  await t.step({
    name: "No Exits",
    fn() {
      const { run, trace } = setup();
      const a0 = Z.atom([], () => "A");
      const a1 = Z.atom([a0], (r) => [r, "B"]);
      const a2 = Z.atom([a1], (r) => [...r, "C"]);
      run(a2);
      Z.assertTrace(
        trace,
        Z.traceDesc()
          .enter(a0, (r) => asserts.assertEquals(r, "A"))
          .enter(a1, (r) => asserts.assertEquals(r, ["A", "B"]))
          .enter(a2, (r) => asserts.assertEquals(r, ["A", "B", "C"])),
      );
    },
  });

  await t.step({
    name: "Non-erroring Exits",
    fn() {
      const { run, trace } = setup();
      const a0 = Z.atom([], () => "A", () => {});
      const a1 = Z.atom([a0], (r) => [r, "B"], () => {});
      const a2 = Z.atom([a1], (r) => [...r, "C"], () => {});
      run(a2);
      Z.assertTrace(
        trace,
        Z.traceDesc()
          .enter(a0, (r) => asserts.assertEquals(r, "A"))
          .enter(a1, (r) => asserts.assertEquals(r, ["A", "B"]))
          .exit(a0)
          .enter(a2, (r) => asserts.assertEquals(r, ["A", "B", "C"]))
          .exit(a1)
          .exit(a2),
      );
    },
  });

  await t.step({
    name: "Early-erroring Exit",
    fn() {
      const { run, trace } = setup();
      const a0 = Z.atom([], () => "A", () => {
        return new Error();
      });
      const a1 = Z.atom([a0], (r) => [r, "B"], () => {});
      const a2 = Z.atom([a1], (r) => [...r, "C"], () => {});
      run(a2);
      Z.assertTrace(
        trace,
        Z.traceDesc()
          .enter(a0, (r) => asserts.assertEquals(r, "A"))
          .enter(a1, (r) => asserts.assertEquals(r, ["A", "B"]))
          .exit(a0, (r) => asserts.assertInstanceOf(r, Error))
          .exit(a1, (r) => asserts.assertEquals(r, undefined)),
      );
    },
  });

  await t.step({
    name: "Middle-erroring Exit",
    fn() {
      const { run, trace } = setup();
      const a0 = Z.atom([], () => "A", () => {});
      const a1 = Z.atom([a0], (r) => [r, "B"], () => {
        return new Error();
      });
      const a2 = Z.atom([a1], (r) => [...r, "C"], () => {});
      run(a2);
      Z.assertTrace(
        trace,
        Z.traceDesc()
          .enter(a0, (r) => asserts.assertEquals(r, "A"))
          .enter(a1, (r) => asserts.assertEquals(r, ["A", "B"]))
          .exit(a0)
          .enter(a2, (r) => asserts.assertEquals(r, ["A", "B", "C"]))
          .exit(a1, (r) => asserts.assertInstanceOf(r, Error))
          .exit(a2, (r) => asserts.assertEquals(r, undefined)),
      );
    },
  });

  await t.step({
    name: "End-erroring Exit",
    fn() {
      const { run, trace } = setup();
      const a0 = Z.atom([], () => "A", () => {});
      const a1 = Z.atom([a0], (r) => [r, "B"], () => {});
      const a2 = Z.atom([a1], (r) => [...r, "C"], () => {
        return new Error();
      });
      run(a2);
      Z.assertTrace(
        trace,
        Z.traceDesc()
          .enter(a0, (r) => asserts.assertEquals(r, "A"))
          .enter(a1, (r) => asserts.assertEquals(r, ["A", "B"]))
          .exit(a0)
          .enter(a2, (r) => asserts.assertEquals(r, ["A", "B", "C"]))
          .exit(a1)
          .exit(a2, (r) => asserts.assertInstanceOf(r, Error)),
      );
    },
  });
});

function setup() {
  const trace = Z.trace();
  const run = Z.runtime({ hooks: [trace] });
  return { run, trace };
}
