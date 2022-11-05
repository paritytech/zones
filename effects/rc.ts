import { E, Effect, effect } from "../Effect.ts";
import * as U from "../util/mod.ts";
import { LsT } from "./ls.ts";

export function rc<Keys extends RcKeys>(
  ...keys: Keys
): Effect<RcT<Keys>, E<Keys[number]>> {
  return effect({
    kind: "Rc",
    init(env) {
      const rcContext = env.state(this.id, RcCounters);
      const sig = U.id(keys[0]);
      let counter = rcContext.get(sig);
      if (!counter) {
        counter = new RcCounter();
        rcContext.set(sig, counter);
      }
      counter.i += 1;
      return () => {
        return U.thenOk(
          U.all(...keys.map(env.resolve)),
          (keys) => [keys, counter!],
        ) as any;
      };
    },
    args: keys,
  });
}

export type RcKeys = [target: unknown, ...keys: unknown[]];
export type RcT<Keys extends RcKeys> = [
  LsT<Keys>,
  RcCounter,
];

// @dprint-ignore-next-line
export class RcCounter { i = 1 }
export class RcCounters extends Map<string, RcCounter> {}
