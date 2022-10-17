import { E, EffectLike, T, V } from "./Effect.ts";
import { UntypedError } from "./Error.ts";
import {
  EnsureSoleApplies,
  flattenApplies,
  PlaceholderApplied,
} from "./Placeholder.ts";
import { Process } from "./Process.ts";

// TODO: re-think some of the placeholder/applied/misc. naming
export function runtime<Applies extends PlaceholderApplied[]>(
  ...applied: EnsureSoleApplies<Applies>
): Runtime<Applies> {
  return (root, apply?) => {
    return new Process({
      ...flattenApplies(...applied as any),
      ...apply ? apply(flattenApplies as any) : {},
    }).init(root)() as any;
  };
}

export interface Runtime<Applies extends PlaceholderApplied[]> {
  <Root extends EffectLike>(
    root: Root,
    ...[apply]:
      [Exclude<V<Root>, Applies[number]["placeholder"]["key"]>] extends [never]
        ? []
        : [
          useApplies: UseApplies<
            V<Root>,
            Applies[number]["placeholder"]["key"]
          >,
        ]
  ): Promise<E<Root> | UntypedError | T<Root>>;
}

type UseApplies<V extends PropertyKey, G extends PropertyKey> = (
  use: <A extends PlaceholderApplied[]>(
    ...applies: EnsureSoleApplies<A, G>
  ) => Record<A[number]["placeholder"]["key"], unknown>,
) => Record<Exclude<V, G>, unknown>;
