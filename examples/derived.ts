import { derive } from "../core/unsafe/mod.ts";
import * as Z from "../mod.ts";

const coinToss = Z.call(0, () => {
  return Math.random() > .5;
});

const root = derive(coinToss, (truth) => {
  return truth
    ? Z.call(undefined!, () => "HELLO")
    : Z.call(undefined!, () => "GOODBYE");
});

const result = await Z.runtime()(root);

console.log(result);
