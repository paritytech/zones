import { ExitResult, matchResult } from "../common.ts";
import { E, Effect, EffectLike, EffectState, T, V } from "../Effect.ts";
import { Process } from "../Run.ts";

export function drop<S extends EffectLike, R extends ExitResult>(
  scope: S,
  cb: DropCb<S, R>,
): Drop<S, R> {
  return new Drop(scope, cb);
}

export class Drop<
  S extends EffectLike = EffectLike,
  R extends ExitResult = ExitResult,
> extends Effect<"Drop", V<S>, E<S> | Extract<Awaited<R>, Error>, T<S>> {
  constructor(
    readonly scope: S,
    readonly cb: DropCb<S, R>,
  ) {
    super("Drop", [scope, cb]);
  }

  state = (process: Process): DropState => {
    return new DropState(process, this as Drop<any, R>);
  };
}

export type DropCb<
  Scope extends EffectLike = EffectLike,
  ExitR extends ExitResult = ExitResult,
> = (scopeResolved: T<Scope>) => ExitR;

export class DropState extends EffectState<Drop> {
  getResult = () => {
    if (!("result" in this)) {
      this.onOrphaned(() => {
        return matchResult(this.result, (ok) => {
          return this.source.cb(ok);
        });
      });
      const scopeResult = this.process.get(this.source.scope.id)!.getResult();
      this.result = matchResult(scopeResult, (ok) => {
        return matchResult(this.source.cb(ok), () => {
          return scopeResult;
        });
      });
    }
    return this.result;
  };
}
