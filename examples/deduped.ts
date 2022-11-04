import * as Z from "../mod.ts";

// TODO: show use of ctx

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

const dupResult = Z.ls(dup(), dup()).run(); // `["0", "1"]`
const dedupedResult = Z.ls(deduped(), deduped()).run(); // `["0", "0"]`

console.log({ dupResult, dedupedResult });
