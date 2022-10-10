import * as Z from "../mod.ts";

class Add<A extends Z.$<number>, B extends Z.$<number>> extends Z.Name {
  root;

  constructor(
    readonly a: A,
    readonly b: B,
  ) {
    super();
    this.root = new Z.Call(Z.rec({ a, b }), (x) => {
      return x.a + x.b;
    }, undefined!);
  }
}

const root = new Add(1, new Add(2, new Add(3, 4)));

const { run } = new Z.Runtime();

const result = await run(root);

console.log(result);
