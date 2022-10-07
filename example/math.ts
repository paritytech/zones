import * as Z from "../mod.ts";

const factor_ = Symbol();
export const factor = Z._<number>()(factor_);

const run = Z.run({
  apply: [factor(10)],
});

class AddingZeroError extends Error {}
class SubtractingZeroError extends Error {}

function add<A extends Z.$<number>, B extends Z.$<number>>(a: A, b: B) {
  return Z.call(Z.ls(a, b), ([a, b]) => {
    if (a === 0 || b === 0) {
      return new AddingZeroError();
    }
    return a + b;
  });
}

interface SubtractProps {
  a: number;
  b: number;
}
function subtract<Props extends Z.Rec$<SubtractProps>>(props: Props) {
  return Z.call(Z.rec(props), ({ a, b }) => {
    if (b === 0) {
      return new SubtractingZeroError();
    }
    return a - b;
  });
}

const rand = Z.call(factor, (f) => {
  return f * Math.random();
});

const x = add(
  1,
  add(
    2,
    subtract({
      a: rand,
      b: subtract({ a: 4, b: 5 }),
    }),
  ),
);

const root = Z.try(x, (err) => {
  if (err instanceof AddingZeroError) {
    return "whatever";
  }
  return err;
});

run(root, undefined!);
