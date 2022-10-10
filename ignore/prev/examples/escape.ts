import * as Z from "../mod.ts";

const a = Z.call(() => {
  console.log("enter a", "HELLO");
  return "HELLO";
}, (r) => {
  console.log("exit a", r);
  return new SomeError();
});

const b = Z.call(a, (a) => {
  console.log("enter b", a);
  return a;
}, (r) => {
  console.log("exit b", r);
});

export const std = Symbol();
const _ = Z.placeholder(std);

const c = Z.rec({
  placeheld: _<number>("a"),
  placeheld_2: _<number>("ns"),
  optional: _<number | undefined>("opt"),
});

run(root, {
  [std]: {
    a: 1,
    ns: 5,
  },
});

class SomeError extends Error {}

const { run } = new Z.Runtime();
const result = run(b);
// console.log(result);

// function call<A, B>(a: A, b: (a: A) => B, c: (b: B) => any): void;
// function call<A, B>(a: A, b: (a: A) => B): void;
// function call<A, B>(a: (a: A) => B, b: (b: B) => any): void;
// function call<A, B>(a: (a: A) => B): void {}
