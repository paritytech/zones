import * as Z from "../mod.ts";
import { run } from "./common.ts";

interface AddEnv {
  add(a: number, b: number): number;
}

class AddZeroError extends Error {
  override readonly name = "AddZero";
}

export const add = Z.atomf(function(this: AddEnv, a: number, b: number) {
  if (a === 0 || b === 0) {
    return new AddZeroError();
  }
  return this.add(a, b);
});

const root = add(1, add(2, add(3, 4)));

const result = run(root, {
  add(a, b) {
    return a + b;
  },
});

console.log(result);
