const denoCustomInspect = Symbol.for("Deno.customInspect");
const nodeCustomInspect = Symbol.for("nodejs.util.inspect.custom");

export function customInspects(
  inspect: RuntimeAgnosticCustomInspect,
): CustomInspects {
  return {
    [denoCustomInspect](inspect, options) {
      return this.inspect((value) => inspect(value, options));
    },
    [nodeCustomInspect](_0, _1, inspect) {
      return this.inspect(inspect);
    },
    inspect,
  };
}

export interface CustomInspects {
  /** Runtime-agnostic custom inspect */
  inspect: RuntimeAgnosticCustomInspect;
  /** Deno custom inspect */
  [denoCustomInspect]: DenoCustomInspect;
  /** Node custom inspect */
  [nodeCustomInspect]: NodeCustomInspect;
}

export type Inspect = (value: unknown) => string;
type RuntimeAgnosticCustomInspect = (inspect: Inspect) => string;
type DenoCustomInspect = (
  inspect: (value: unknown, opts: Deno.InspectOptions) => string,
  opts: Deno.InspectOptions,
) => string;
type NodeCustomInspect = (
  depth: number,
  options: unknown,
  inspect: Inspect,
) => string;
