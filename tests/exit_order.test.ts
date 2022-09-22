import { assertEquals } from "../deps/std/testing/asserts.ts";
import * as Z from "../mod.ts";
import { VisitTracker, VisitTrackerEvent } from "./common.ts";

Deno.test("sync", () => {
  const visitTracker = new VisitTracker();
  const [t0, t1, t2] = visitTracker.handles(3);
  const a0 = Z.atom([], t0.enter, t0.exit);
  const a1 = Z.atom([a0], t1.enter, t1.exit);
  const a2 = Z.atom([a1], t2.enter, t2.exit);
  new Z.Runtime().run(a2);
  assertEquals(
    visitTracker.sequence,
    VisitTrackerEvent.sequence(
      ["enter", 0],
      ["enter", 1],
      ["exit", 0],
      ["enter", 2],
      ["exit", 1],
      ["exit", 2],
    ),
  );
});
