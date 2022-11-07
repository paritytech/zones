import * as Z from "../mod.ts";

const result = Z.wrap(Z.call(0, () => "HELLO"), "theKey").run();

console.log(result);
