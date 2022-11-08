import * as Z from "../mod.ts";

const untypedError = Z.call(() => {
  if (true as boolean) {
    throw new Error();
  }
  return "HELLO";
});

throw untypedError.run();
