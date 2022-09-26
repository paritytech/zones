import * as Z from "../mod.ts";

class Add<A extends Z.$<number>, B extends Z.$<number>> extends Z.Name {
  root;

  constructor(
    readonly a: A,
    readonly b: B,
  ) {
    super();
    this.root = Z.atom([a, b], (a, b) => {
      return a + b;
    });
  }
}

const root = new Add(1, new Add(2, new Add(3, 4)));

const result = Z.runtime()(root);

console.log(result);
