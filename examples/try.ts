import * as Z from "../mod.ts";

const a = Z.call(undefined!, () => {
  if (true as boolean) {
    return new EA();
  }
  return "A";
});
class EA extends Error {
  override readonly name = "EA";
}

const aResult = a.run();

const b = Z.call(undefined!, () => {
  if (true as boolean) {
    return new EB();
  }
  return "B";
});
class EB extends Error {
  override readonly name = "EB";
}

const bResult = b.run();

const ab = Z.ls(a, b);
const abResult = ab.run();

const catchEa = Z.try(ab, (e) => {
  return !(e instanceof EA) ? e : ["A", "B"] as ["A", "B"];
});
const catchEb = Z.try(ab, (e) => {
  return !(e instanceof EB) ? e : ["A", "B"] as ["A", "B"];
});
const catchEBoth = Z.try(ab, (e) => {
  return e instanceof Error ? ["A", "B"] as ["A", "B"] : e;
});

const catchEaResult = catchEa.run();
const catchEbResult = catchEb.run();
const catchEBothResult = catchEBoth.run(); // TODO: why doesn't the signature *flatten*?

const {
  0: aResolved,
  1: bResolved,
  2: abResolved,
  3: catchEaResolved,
  4: catchEbResolved,
  5: catchBothResolved,
} = await Promise.all([
  aResult,
  bResult,
  abResult,
  catchEaResult,
  catchEbResult,
  catchEBothResult,
]);

console.log({
  aResolved,
  bResolved,
  abResolved,
  catchEaResolved, // TODO: this should resolve to an error
  catchEbResolved,
  catchBothResolved,
});
