import * as Z from "../mod.ts";

let dupI = 0;
function dup() {
  return Z.call(0, () => {
    return `${dupI++}`;
  });
}

let dedupedI = 0;
function deduped() {
  return Z.call(0, function dedupedImpl() {
    return `${dedupedI++}`;
  });
}

const run = Z.runtime();

const dupResult = run(Z.ls(dup(), dup())); // `["0", "1"]`
const dedupedResult = run(Z.ls(deduped(), deduped())); // `["0", "0"]`

console.log({ dupResult, dedupedResult });
