import { matchResult, thrownAsUntypedError } from "../common.ts";
import { E, Effect, EffectState, isEffectLike, T, V } from "../Effect.ts";
import { Process } from "../Run.ts";
import { Ls, Ls$ } from "./Ls.ts";

export function call<D, R>(dep: D, fn: CallFn<D, R>): Call<D, R> {
  return new Call(dep, fn);
}
export namespace call {
  export function f<A extends unknown[], R>(fn: (...args: A) => R) {
    return <X extends Ls$<A>>(...args: X) => {
      return new Call(new Ls(...args), fn as unknown as CallFn<Ls<[...X]>, R>);
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
    readonly fn: CallFn<D, R>,
  ) {
    super("Call", [dep, fn]);
  }

  state = (process: Process): CallState => {
    return new CallState(process, this);
  };
}

export type CallFn<D, R> = (depResolved: T<D>) => R;

export class CallState extends EffectState<Call> {
  getResult = () => {
    if (!("result" in this)) {
      const dep = isEffectLike(this.source.dep)
        ? this.process.get(this.source.dep.id)!.getResult()
        : this.source.dep;
      this.result = matchResult(
        matchResult(dep, thrownAsUntypedError(this.source.fn)),
        (result) => {
          return matchResult(
            this.removeDependent(this.source.dep),
            (_) => result,
          );
        },
      );
    }
    return this.result;
  };
}
