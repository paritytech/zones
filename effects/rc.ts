import { E, Effect, effect } from "../Effect.ts";
import * as U from "../util/mod.ts";
import { LsT } from "./ls.ts";

export function rc<Args extends RcArgs>(
  ...args: Args
): Effect<RcT<Args>, E<Args[number]>> {
  return effect({
    kind: "Rc",
    init(env) {
      const counter = env.state(`Rc(${U.id(args[0])})`, RcCounter);
      counter.i += 1;
      return () => {
        return U.thenOk(
          U.all(...args.map(env.resolve)),
          (keys) => [keys, counter],
        );
      };
    },
    args,
  });
}

export type RcArgs = [target: unknown, ...keys: unknown[]];
export type RcT<Keys extends RcArgs> = [
  LsT<Keys>,
  RcCounter,
];

// @dprint-ignore-next-line
export class RcCounter { i = 0 }
