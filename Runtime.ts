import { E, Effect, T, V } from "./Effect.ts";
import { UntypedZonesError } from "./Error.ts";
import { EnsureSoleApplies, flattenApplies } from "./Placeholder.ts";
import { Process } from "./Process.ts";
import * as U from "./util/mod.ts";

// TODO: re-think some of the placeholder/applied/misc. naming
export function runtime<Applies extends Record<PropertyKey, unknown>[]>(
  ...applied: EnsureSoleApplies<Applies>
): Runtime<keyof U.U2I<Applies[number]>> {
  return (root, apply?) => {
    return new Process({
      ...flattenApplies(...applied as any),
      ...apply ? apply(flattenApplies as any) : {},
    }).init(root)() as any;
  };
}

export interface Runtime<Applies extends PropertyKey> {
  <Root extends Effect>(
    root: Root,
    ...[apply]: [Exclude<V<Root>, Applies>] extends [never] ? []
      : [useApplies: UseApplies<V<Root>, Applies>]
  ): Promise<E<Root> | UntypedZonesError | T<Root>>;
}

type UseApplies<V extends PropertyKey, G extends PropertyKey> = (
  use: <A extends Record<PropertyKey, unknown>[]>(
    ...applies: EnsureSoleApplies<A, G>
  ) => Record<keyof U.U2I<A[number]>, unknown>,
) => Record<Exclude<V, G>, unknown>;
