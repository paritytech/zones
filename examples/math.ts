import * as Z from "../mod.ts";

interface AddEnv {
  add(a: number, b: number): number;
}

class AddZeroErr extends Error {
  override readonly name = "AddZero";
}

export const add = Z.atomf(function(
  this: AddEnv,
  a: number,
  b: number,
) {
  if (a === 0 || b === 0) {
    return new AddZeroErr();
  }
  return this.add(a, b);
});

const root = add(1, add(2, add(3, 4)));

const result = await Z.runtime()(root, {
  add(a, b) {
    return a + b;
  },
});

console.log(result);
