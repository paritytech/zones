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
export interface SubtractProps {
  a: number;
  b: number;
}
function subtract<Props extends Z.Rec$<SubtractProps>>(props: Props) {
  return Z.call(Z.rec(props), ({ a, b }) => {
    if (b === 0) return new SubtractingZeroError();
    return a - b;
  });
}

const root = add(
  10,
  add(
    2,
    subtract({
      a: 3,
      b: 4,
    }),
  ),
);

const result = await Z.runtime()(root);

console.log(result);
