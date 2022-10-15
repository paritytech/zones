import { E, Effect, EffectRun, isEffectLike, V } from "../Effect.ts";

export function rc<Of>(of: Of): Rc<Of> {
  return new Rc(of);
}

export class Rc<Of>
  extends Effect<"Rc", V<Of>, E<Of>, undefined | (() => number)>
{
  constructor(readonly of: Of) {
    super("Rc", [of]);
  }

  run: EffectRun = ({ process }) => {
    const { of } = this;
    if (isEffectLike(of)) {
      return () => {
        return process.state(of).dependents.size;
      };
    }
    return undefined;
  };
}
