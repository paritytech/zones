import { E, Effect, effect, V } from "../Effect.ts";
import * as U from "../util/mod.ts";
import { LsT } from "./ls.ts";

export type RcKeys = [target: unknown, ...keys: unknown[]];
export type RcT<Keys extends RcKeys> = [
  LsT<Keys>,
  RcCounter,
];

export function rc<Keys extends RcKeys>(
  ...keys: Keys
): Effect<RcT<Keys>, E<Keys[number]>, V<Keys[number]>> {
  return effect({
    kind: "Rc",
    run: (process) => {
      const rcContext = process.context(RcCounters);
      const sig = U.id.of(keys[0]);
      let counter = rcContext.get(sig);
      if (!counter) {
        counter = new RcCounter();
        rcContext.set(sig, counter);
      }
      counter.i += 1;
      return () => {
        return U.thenOk(
          U.all(...keys.map(process.resolve)),
          (keys) => [keys, counter!],
        );
      };
    },
    children: keys,
  });
}

// @dprint-ignore-next-line
export class RcCounter { i = 1 }
export class RcCounters extends Map<string, RcCounter> {}
