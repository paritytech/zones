export const denoCustomInspect = Symbol.for("Deno.customInspect");
export const nodeCustomInspect = Symbol.for("nodejs.util.inspect.custom");

export const denoCustomInspectDelegate: DenoCustomInspect = function(
  this,
  inspect,
  options,
) {
  return this.inspect((value) => inspect(value, options));
};

export const nodeCustomInspectDelegate: NodeCustomInspect = function(
  this,
  _depth,
  _options,
  inspect,
) {
  return this.inspect(inspect);
};

export interface CustomInspects {
  /** Runtime-agnostic custom inspect */
  inspect: RuntimeAgnosticCustomInspect;
  /** Deno custom inspect */
  [denoCustomInspect]: DenoCustomInspect;
  /** Node custom inspect */
  [nodeCustomInspect]: NodeCustomInspect;
}

export type Inspect = (value: unknown) => string;
export type RuntimeAgnosticCustomInspect = (inspect: Inspect) => string;
export type DenoCustomInspect = (
  this: CustomInspects,
  inspect: (
    value: unknown,
    // @ts-ignore dnt error TS2694: Namespace '"target/npm/node_modules/@deno/shim-deno-test/dist/test"' has no exported member 'InspectOptions'
    opts: Deno.InspectOptions,
  ) => string,
  // @ts-ignore dnt error TS2694: Namespace '"target/npm/node_modules/@deno/shim-deno-test/dist/test"' has no exported member 'InspectOptions'
  opts: Deno.InspectOptions,
) => string;
export type NodeCustomInspect = (
  this: CustomInspects,
  depth: number,
  options: unknown,
  inspect: Inspect,
) => string;
