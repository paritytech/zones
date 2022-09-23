import { assertEquals } from "../deps/std/testing/asserts.ts";
import * as Z from "../mod.ts";

const trace = Z.trace();

interface AddEnv {
  add(a: number, b: number): number;
}

class AddZeroErr extends Error {
  override readonly name = "AddZero";
}

export const add = Z.atomf(function(this: AddEnv, a: number, b: number) {
  if (a === 0 || b === 0) {
    return new AddZeroErr();
  }
  return this.add(a, b);
});

const a = add(3, 4);
const b = add(2, a);
const root = add(1, b);

const result = Z.run({ hooks: [trace] })(root, {
  add(a, b) {
    return a + b;
  },
});

console.log(result);
