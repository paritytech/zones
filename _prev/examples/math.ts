import * as Z from "../mod.ts";

interface AddEnv {
  add(a: number, b: number): number;
}

class AddZeroErr extends Error {
  override readonly name = "AddZero";
}

function add<
  A extends Z.$<number>,
  B extends Z.$<number>,
>(a: A, b: B) {
  return new Z.Call(Z.list(a, b), function(this: AddEnv, [a, b]) {
    if (a === 0 || b === 0) {
      return new AddZeroErr();
    }
    return this.add(a, b);
  }, undefined!);
}

const root = add(1, add(2, add(3, 4)));

const { run } = new Z.Runtime();

const result = await run(root, {
  add(a, b) {
    return a + b;
  },
});

console.log(result);
