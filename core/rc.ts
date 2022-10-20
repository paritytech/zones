import { E, Effect, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rc<Target, Keys extends unknown[]>(
  target: Target,
  ...keys: Keys
): Effect<() => number, E<Target | Keys[number]>, V<Target | Keys[number]>> {
  return new Effect("Rc", (process) => {
    const rcContext = process.context(RcContext);
    rcContext.increment(U.sig.of(target));
    return () => {
      return () => {
        const current = rcContext.get(U.sig.of(target))!;
        rcContext.decrement(U.sig.of(target));
        return current;
      };
    };
  }, [target, ...keys]);
}

class RcContext extends Map<unknown, number> {
  increment = (target: unknown) => {
    const current = this.get(target);
    if (current) {
      this.set(target, current + 1);
    } else {
      this.set(target, 1);
    }
  };

  decrement = (target: unknown) => {
    this.set(target, this.get(target)! - 1);
  };
}
