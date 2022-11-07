import * as Z from "../mod.ts";

const result = Z.call(() => "HELLO").wrap("theKey").run();

console.log(result);
