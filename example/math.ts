import * as Z from "../mod.ts";

class AddingZeroError extends Error {
  override readonly name = "AddingZeroError";
}
function add<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.drop(
    Z.call(Z.ls(a, b), ([a, b]) => {
      console.log("entering add");
      if (a === 0 || b === 0) return new AddingZeroError();
      return a + b;
    }),
    (v) => {
      console.log("exiting add", v);
    },
  );
}

class SubtractingZeroError extends Error {
  override readonly name = "SubtractingZeroError";
}
function subtract<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.drop(
    Z.call(Z.ls(a, b), ([a, b]) => {
      console.log("entering subtract");
      if (b === 0) return new SubtractingZeroError();
      return a - b;
    }),
    (v) => {
      console.log("exiting subtract", v);
    },
  );
}

const mathOps = add(1, add(3, subtract(1, 10)));
const root = Z.try(mathOps, (err) => {
  if (err instanceof AddingZeroError) {
    return "Tried to add zero";
  }
  return err;
});

const result = await Z.run()(root);

// console.log(result);
