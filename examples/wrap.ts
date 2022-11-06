import * as Z from "../mod.ts";

const x = Z.call(0, () => "HELLO");

const y = Z.wrap(x, "theKey");

const result = await y.run();

console.log(result);
