import { Collection$, E, S, V } from "./common.ts";
import { Effect, EffectId } from "./Effect.ts";
import { sig } from "./Signature.ts";
import { U2I } from "./util.ts";

export function all<C extends unknown[]>(...list: [...C]): All<C> {
  return new All(list);
}

export class All<List extends unknown[]> extends Effect<
  S<List[number]>,
  U2I<V<List[number]>>,
  E<List[number]>,
  Collection$<List>
> {
  id;

  constructor(readonly list: [...List]) {
    super();
    this.id = `list(${list.map(sig.unknown).join(",")})` as EffectId;
  }
}
