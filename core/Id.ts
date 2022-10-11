import { E, Effect, EffectRun, V } from "../Effect.ts";

export function id<Scope extends [scope?: any]>(
  ...[scope]: Scope
): Id<Scope[0]> {
  return new Id(scope);
}

export class Id<Scope extends unknown = any>
  extends Effect<"Id", V<Scope>, E<Scope>, string>
{
  constructor(readonly scope: Scope) {
    super("Id", [scope]);
  }

  enter: EffectRun = () => {
    return this.id;
  };
}
