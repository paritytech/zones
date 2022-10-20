import * as Z from "../mod.ts";

let i = 0;

function f() {
  return Z.call(0, () => {
    console.log(i++);
    return "HELLO!";
  });
}

await Z.runtime()(Z.ls(f(), f()));
