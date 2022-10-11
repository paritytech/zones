import {
  E,
  Effect,
  EffectExit,
  EffectLike,
  EffectRun,
  T,
  V,
} from "../Effect.ts";
import { ExitResult } from "../util/mod.ts";

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

  enter: EffectRun = ({ process }) => {
    return process.get(this.scope.id)!.result;
  };

  override exit: EffectExit = ({ result }) => {
    this.cb(result as T<S>);
  };
}

export type DropCb<
  Scope extends EffectLike = EffectLike,
  ExitR extends ExitResult = ExitResult,
> = (scopeResolved: T<Scope>) => ExitR;
