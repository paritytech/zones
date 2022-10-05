import { EffectLike } from "./common.ts";
import { Hooks } from "./Hooks.ts";
import { Process } from "./Process.ts";

export interface RuntimeProps {
  hooks?: Hooks[];
}

export class Runtime {
  constructor(readonly props?: RuntimeProps) {}

  run = <
    S extends boolean,
    V,
    E extends Error,
    T,
  >(
    root: EffectLike<S, V, E, T>,
    ...[env]: unknown extends V ? [] : [env: V]
  ) => {
    return new Process(this.props, root, env)
      .result() as ColoredResult<S, E | T>;
  };
}

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;
