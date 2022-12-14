import * as Z from "../mod.ts";

let dupI = 0;
function dup() {
  return Z.call(() => {
    return `${dupI++}`;
  });
}

let dedupedI = 0;
function deduped() {
  return Z.call(function dedupedImpl() {
    return `${dedupedI++}`;
  });
}

const dupResult = Z.ls(dup(), dup()).run(); // `["0", "1"]`
const dedupedResult = Z.ls(deduped(), deduped()).run(); // `["0", "0"]`

console.log({ dupResult, dedupedResult });
