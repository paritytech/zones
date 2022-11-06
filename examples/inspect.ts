import * as Z from "../mod.ts";

const a = Z
  .call(0, () => "HELLO")
  .zoned("Greeting");
const b = Z
  .call(a, (aR) => [aR, "WORLD"])
  .zoned("GreetingAndSubject");
console.log(b);
