import { E, Effect, EffectLike, T, V } from "../Effect.ts";
import * as U from "../util/mod.ts";

export function rc<Target, UseCountR extends EffectLike>(
  target: Target,
  produce: (count: number) => UseCountR,
): Effect<T<UseCountR>, E<UseCountR>, V<UseCountR>> {
  return new Effect("Rc", (process) => {
    const rcContext = process.context(RcContext);
    rcContext.increment(target);
    return () => {
      const current = rcContext.get(target)!;
      return U.then(process.init(produce(current))(), (result) => {
        rcContext.decrement(target);
        return result;
      });
    };
  }, [target, produce]);
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
