import * as Z from "../mod.ts";

const untypedError = Z.call(0, () => {
  if (true as boolean) {
    throw new Error();
  }
  return "HELLO";
});

const result = untypedError.run();

if (result instanceof Z.ZonesUntypedError) {
  console.log(result.source);
}
