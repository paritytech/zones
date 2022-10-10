import { PlaceholderApplied } from "../../Placeholder.ts";
import * as c from "./common.ts";

type DisallowOverrides<
  T extends PlaceholderApplied[],
  V extends PlaceholderApplied = never,
  N extends (PlaceholderApplied | c.SolePlaceholderApplied)[] = [],
> = T extends [
  infer E0 extends PlaceholderApplied,
  ...infer ER extends PlaceholderApplied[],
] ? E0 extends V ? DisallowOverrides<ER, V, [...N, c.SolePlaceholderApplied]>
  : DisallowOverrides<ER, V | E0, [...N, E0]>
  : N;

declare function overridesDisallowed<T extends PlaceholderApplied[]>(
  ...rest: T & DisallowOverrides<T>
): void;

const r = overridesDisallowed(
  // @ts-expect-error: intentional
  c.clientFactory("wss..."),
  c.clientFactory("wss..."),
  c.retryDelay(100),
  c.retryDelay(100),
  c.logger(console.log),
  c.logger(console.log),
);
