const denoCustomInspect = Symbol.for("Deno.customInspect");
const nodeCustomInspect = Symbol.for("nodejs.util.inspect.custom");

export function inspect(inspect: RuntimeAgnosticInspect): CustomInspectBearer {
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

export interface CustomInspectBearer {
  /** Runtime-agnostic custom inspect */
  inspect: RuntimeAgnosticInspect;
  /** Deno custom inspect */
  [denoCustomInspect]: DenoInspect;
  /** Node custom inspect */
  [nodeCustomInspect]: NodeInspect;
}

export type Inspect = (value: unknown) => string;
type RuntimeAgnosticInspect = (inspect: Inspect) => string;
type DenoInspect = (
  inspect: (value: unknown, opts: Deno.InspectOptions) => string,
  opts: Deno.InspectOptions,
) => string;
type NodeInspect = (
  depth: number,
  options: unknown,
  inspect: Inspect,
) => string;
