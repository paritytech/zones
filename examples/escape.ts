import * as Z from "../mod.ts";

const a = Z.atom([], () => {
  console.log("enter a");
  return "HELLO";
}, () => {
  console.log("exit a");
  return new SomeError();
});

const b = Z.atom([a], (a) => {
  console.log("enter b");
  return a;
}, () => {
  console.log("exit b");
});

class SomeError extends Error {}

const run = Z.runtime();
const result = run(b);
console.log(result);
