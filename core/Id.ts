import { E, Effect, EffectState, V } from "../Effect.ts";
import { Process } from "../Run.ts";

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

  state = (process: Process): IdState => {
    return new IdState(process, this);
  };
}

export class IdState extends EffectState<Id> {
  getResult = (): string => {
    return this.source.id;
  };
}
