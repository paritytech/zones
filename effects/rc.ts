import { E, Effect, V } from "../Effect.ts";
import * as U from "../util/mod.ts";
import { LsT } from "./ls.ts";

export type RcT<Keys extends [target: unknown, ...keys: unknown[]]> = [
  LsT<Keys>,
  Counter,
];

export function rc<Keys extends [target: unknown, ...keys: unknown[]]>(
  ...keys: Keys
): Effect<RcT<Keys>, E<Keys[number]>, V<Keys[number]>> {
  return new Effect("Rc", (process) => {
    const rcContext = process.context(Counters);
    const sig = U.id.of(keys[0]);
    let counter = rcContext.get(sig);
    if (!counter) {
      counter = new Counter();
      rcContext.set(sig, counter);
    }
    counter.i += 1;
    return () => {
      return U.thenOk(
        U.all(...keys.map(process.resolve)),
        (keys) => [keys, counter!],
      );
    };
  }, keys);
}

// @dprint-ignore-next-line
export class Counter { i = 1 }
export class Counters extends Map<string, Counter> {}
