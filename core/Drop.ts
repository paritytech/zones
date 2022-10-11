import { ExitResult } from "../common.ts";
import { E, Effect, EffectLike, EffectRun, T, V } from "../Effect.ts";

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
    super("Drop", dropRun, [scope, cb]);
  }
}

export type DropCb<
  Scope extends EffectLike = EffectLike,
  ExitR extends ExitResult = ExitResult,
> = (scopeResolved: T<Scope>) => ExitR;

const dropRun: EffectRun<Drop> = (props) => {
  props.attachExitCb(props.source.cb);
  return props.process.get(props.source.scope.id)!.result;
};
