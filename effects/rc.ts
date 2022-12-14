import { E, Effect } from "../Effect.ts";
import * as U from "../util/mod.ts";
import { LsT } from "./ls.ts";

/** A means of explicitly tracking references to a target effect */
export function rc<Args extends RcArgs>(
  ...args: Args
): Effect<RcT<Args>, E<Args[number]>> {
  return new Effect({
    kind: "Rc",
    impl(env) {
      const counter = env.state(`Rc(${U.id(args[0])})`, RcCounter);
      counter.i += 1;
      return () => {
        return U.thenOk(
          U.all(...args.map(env.resolve)),
          (keys) => [keys, counter],
        );
      };
    },
    items: args,
    memoize: false,
  });
}

/** The arguments to be supplied to the rc effect factory */
export type RcArgs = [target: unknown, ...keys: unknown[]];
/**
 * The resolution of an rc effect (a tuple in which e0 is a list of the
 * resolved rc args and e1 is the counter for the specified target)
 */
export type RcT<Args extends RcArgs> = [LsT<Args>, RcCounter];

/** A simple counter for use within rc effects */
// @dprint-ignore-next-line
export class RcCounter { i = 0 }
