import { E, Effect, isEffectLike, V } from "../Effect.ts";

export function rc<Of>(
  of: Of,
): Effect<undefined | (() => number), E<Of>, V<Of>> {
  return new Effect("Rc", ({ process }) => {
    if (isEffectLike(of)) {
      return () => {
        return process.state(of).dependents.size;
      };
    }
    return undefined;
  }, [of]);
}
