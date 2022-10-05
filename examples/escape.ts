import * as Z from "../mod.ts";

const a = Z.atom([], () => {
  console.log("enter a", "HELLO");
  return "HELLO";
}, (r) => {
  console.log("exit a", r);
  return new SomeError();
});

const b = Z.atom([a], (a) => {
  console.log("enter b", a);
  return a;
}, (r) => {
  console.log("exit b", r);
});

class SomeError extends Error {}

const { run } = new Z.Runtime();
const result = run(b);
// console.log(result);
