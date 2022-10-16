import { E, Effect, V } from "../Effect.ts";

export function rc<Of>(
  of: Of,
  ...keys: unknown[]
): Effect<number, E<Of>, V<Of>> {
  return new Effect("Rc", (process) => {
    const rcContext = process.context(RcContext);
    rcContext.increment(of);
    return () => {
      const current = rcContext.get(of)!;
      rcContext.decrement(of);
      return current;
    };
  }, [of, ...keys]);
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
