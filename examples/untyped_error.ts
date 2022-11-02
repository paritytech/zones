import * as Z from "../mod.ts";

const untypedError = Z.call(0, () => {
  if (true as boolean) {
    throw new Error();
  }
  return "HELLO";
});

const result = Z.runtime()(untypedError);

if (result instanceof Z.UntypedZonesError) {
  console.log(result.source);
}
