import { EffectLike } from "./common.ts";
import { EffectId } from "./Effect.ts";

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}
