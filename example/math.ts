import { derive } from "../core/unsafe/Derive.ts";
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
export interface SubtractProps {
  a: number;
  b: number;
}
function subtract<Props extends Z.Rec$<SubtractProps>>(props: Props) {
  return Z.drop(
    Z.call(Z.rec(props), ({ a, b }) => {
      console.log("entering subtract");
      if (b === 0) return new SubtractingZeroError();
      return a - b;
    }),
    (v) => {
      console.log("exiting subtract", v);
    },
  );
}

const mathOps = add(
  1,
  add(
    3,
    subtract({
      a: 1,
      b: 10,
    }),
  ),
);
const root = Z.try(mathOps, (err) => {
  if (err instanceof AddingZeroError) {
    return "Tried to add zero";
  }
  return err;
});

const derived = derive(root, (r) => {
  return Z.call(undefined!, () => {
    console.log(`More stuff yo`);
    console.log(r);
    return "SUP";
  });
});

const result = await Z.run()(derived);

console.log(result);

const factor_ = Symbol();
const factor = Z._<number>()(factor_);
const rand = Z.call(factor, (r) => {
  return r * Math.random();
});
const run = Z.run();
const result2 = run(rand, (_) =>
  _(
    factor(1),
  ));
console.log(result2);
