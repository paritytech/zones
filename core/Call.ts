import { then, thrownAsUntypedError } from "../common.ts";
import { E, Effect, EffectRun, isEffectLike, T, V } from "../Effect.ts";
import { Ls, Ls$ } from "./Ls.ts";

export function call<D, R>(dep: D, fn: CallLogic<D, R>): Call<D, R> {
  return new Call(dep, fn);
}
export namespace call {
  export function f<A extends unknown[], R>(fn: (...args: A) => R) {
    return <X extends Ls$<A>>(...args: X) => {
      return new Call(
        new Ls(...args),
        fn as unknown as CallLogic<Ls<[...X]>, R>,
      );
    };
  }
}

export class Call<D = any, R = any> extends Effect<
  "Call",
  V<D>,
  E<D> | Extract<Awaited<R>, Error>,
  Exclude<Awaited<R>, Error>
> {
  constructor(
    readonly dep: D,
    readonly logic: CallLogic<D, R>,
  ) {
    super("Call", callRun, [dep, logic]);
  }
}

export type CallLogic<D, R> = (depResolved: T<D>) => R;

const callRun: EffectRun<Call> = ({ process, source }) => {
  return then(
    isEffectLike(source.dep)
      ? process.get(source.dep.id)!.result
      : source.dep,
    thrownAsUntypedError(source.logic),
  );
};
