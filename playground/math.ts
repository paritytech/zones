import * as Z from "../mod.ts";

const another_ = Symbol();
const another = Z._<string>()(another_);

const factor_ = Symbol();
const factor = Z._<number>()(factor_);

function add<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.call(Z.ls(a, b), ([a, b]) => {
    if (a === 0 || b === 0) {
      return new AddingZeroError();
    }
    return a + b;
  });
}

function subtract<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.call(Z.ls(a, b), ([a, b]) => {
    if (b === 0) {
      return new SubtractingZeroError();
    }
    return a - b;
  });
}

const rand = Z.call(Z.ls(factor, Z.id(), another), ([f]) => {
  return f * Math.random();
});

const x = add(1, add(2, subtract(rand, subtract(4, 5))));

const root = Z.try(x, (err) => {
  if (err instanceof AddingZeroError) {
    return "whatever";
  }
  return err;
});

const run = Z.run({
  apply: [factor(10)],
});

const r = await run(root, [
  another("HELLO"),
  // factor(10),
]);

//
//
//

class AddingZeroError extends Error {}
class SubtractingZeroError extends Error {}
