import { CollectionT, E, EffectLike, S, T, V } from "./common.ts";
import { Effect, EffectId } from "./Effect.ts";
import { sig } from "./Signature.ts";
import { U2I } from "./util.ts";

export type IntoResult =
  | undefined
  | false
  | Error
  | EffectLike
  | Promise<undefined | false | Error | EffectLike>;

export function into<
  A extends unknown[],
  IntoV,
  IntoR extends IntoResult,
>(
  args: [...A],
  into: (this: IntoV, ...args: CollectionT<A>) => IntoR,
): Into<A, IntoV, IntoR> {
  return new Into(args, into);
}

export class Into<
  A extends unknown[] = any[],
  IntoV = any,
  IntoR extends IntoResult = IntoResult,
> extends Effect<
  | S<A[number]>
  | (Promise<never> extends IntoR ? false : true)
  | (IntoR extends EffectLike<infer S> ? S : true),
  U2I<V<A[number]>> & IntoV & V<Awaited<IntoR>>,
  E<A[number]> | Extract<Awaited<IntoR>, Error> | E<Awaited<IntoR>>,
  T<Exclude<Awaited<IntoR>, undefined | false>>
> {
  id;

  /**
   * Map an effect into another effect
   * @param args effects, the `T` of which are to be supplied to `enter`
   * @param into a fn that returns either an `EffectLike`, `undefined` or `false`
   */
  constructor(
    readonly args: [...A],
    readonly into: (this: IntoV, ...args: CollectionT<A>) => IntoR,
  ) {
    super();
    let id = "into("; // TODO: improved legibility?
    if (this.args.length) {
      id += "args(";
      for (const arg of this.args) {
        id += sig.unknown(arg) + ",";
      }
      id += "),";
    }
    id += `into_${sig.ref(this.into)}`;
    this.id = id + ")" as EffectId;
  }
}
