import { assertEquals } from "../deps/std/testing/asserts.ts";
import * as Z from "../mod.ts";

Deno.test("name", () => {
  class A extends Z.Name {
    root;
    constructor() {
      super();
      this.root = Z.atom([], () => {
        return "A" as const;
      });
    }
  }
  class B<A extends Z.$<"A">> extends Z.Name {
    root;
    constructor(readonly a: A) {
      super();
      this.root = Z.atom([a], (a) => {
        return a;
      });
    }
  }
  const a = new A();
  const b = new B(a);
  const trace = Z.trace();
  const { run } = new Z.Runtime({ hooks: [trace] });
  run(b);
  Z.assertTrace(
    trace,
    Z.traceMock()
      .enter(a.root, (result) => assertEquals(result, "A"))
      .enter(b.root, (result) => assertEquals(result, "A")),
  );
});
