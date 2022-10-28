import { derive } from "../effects/derive.ts";
import * as Z from "../mod.ts";

const coinToss = Z.call(0, () => {
  return Math.random() > .5;
});

const root = derive(coinToss, (truth) => {
  return Z.call(undefined!, () => truth ? "HELLO" : "GOODBYE");
});

const result = await Z.runtime()(root);

console.log(result);
