import * as Z from "../mod.ts";
import { run } from "./common.ts";

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

const result = run(root);

console.log(result);
