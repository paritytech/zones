import * as Z from "../mod.ts";

class AddingZeroError extends Error {
  override readonly name = "AddingZeroError";
}
function add<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.drop(
    Z.call(Z.ls(a, b), ([a, b]) => {
      console.log("A");
      if (a === 0 || b === 0) return new AddingZeroError();
      return a + b;
    }),
    (x) => {
      console.log("B");
    },
  );
}

class SubtractingZeroError extends Error {
  override readonly name = "SubtractingZeroError";
}
function subtract<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.call(Z.ls(a, b), ([a, b]) => {
    if (b === 0) return new SubtractingZeroError();
    return a - b;
  });
}

const run = Z.run();

const result = run(add(1, add(2, subtract(1, 10))));
console.log(await result);

// console.log(result);
