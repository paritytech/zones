import * as Z from "../mod.ts";

const result = Z.call(0, () => "HELLO").wrap("theKey").run();

console.log(result);
