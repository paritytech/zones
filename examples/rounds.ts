import * as Z from "../mod.ts";

const env = Z.env();

console.log("first", Z.round.run(env));
await Promise.all([
  new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log("second", Z.round.run(env));
      resolve();
    }, 1000);
  }),
  new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log("third", Z.round.run(env));
      resolve();
    }, 1);
  }),
]);
