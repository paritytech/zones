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
  const b = new B(new A());
  const result = new Z.Runtime().run(b);
  assertEquals(result, "A");
});
