import { E, Effect, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rc<Target, Keys extends unknown[]>(
  target: Target,
  ...keys: Keys
): Effect<() => number, E<Target | Keys[number]>, V<Target | Keys[number]>> {
  return new Effect("Rc", (process) => {
    const rcContext = process.context(RcContext);
    const sig = U.sig.of(target);
    rcContext.increment(sig);
    return () => {
      return () => {
        return rcContext.decrement(sig);
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
    const current = this.get(target)!;
    this.set(target, current - 1);
    return current;
  };
}
