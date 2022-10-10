import * as Z from "../mod.ts";

class AddingZeroError extends Error {
  override readonly name = "AddingZeroError";
}
function add<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.call(Z.ls(a, b), ([a, b]) => {
    if (a === 0 || b === 0) return new AddingZeroError();
    return a + b;
  });
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

const root = Z.try(add(1, add(0, subtract(1, 10))), (err) => {
  if (err instanceof AddingZeroError) {
    return "Tried to add zero";
  }
  return err;
});

const result = Z.run()(root);

console.log(await result);
