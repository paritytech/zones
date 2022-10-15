import { E, Effect, EffectRun, isEffectLike, V } from "../Effect.ts";

export function rc<Of>(of: Of): Rc<Of> {
  return new Rc(of);
}

export class Rc<Of> extends Effect<"Rc", V<Of>, E<Of>, number | undefined> {
  constructor(readonly of: Of) {
    super("Rc", [of]);
  }

  run: EffectRun = ({ process }) => {
    if (isEffectLike(this.of)) {
      return process.state(this.of).dependents.size;
    }
    return undefined;
  };
}
