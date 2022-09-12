import { EffectLike } from "./common.ts";

export class Runtime {
  #contexts = new WeakMap<object, Context>();

  // TODO: enable hooking into context for rewrites
  run = <S extends boolean, V extends object, E extends Error, T>(
    root: EffectLike<S, V, E, T>,
    env: unknown extends V ? object : V,
  ): ColoredResult<S, E | T> => {
    let context = this.#contexts.get(env);
    if (!context) {
      context = new Context(env);
      this.#contexts.set(env, context);
    }
    return context.run(root) as ColoredResult<S, E | T>;
  };
}

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;

export class Context {
  constructor(readonly env: object) {}

  run = <T>(_root: EffectLike): T => {
    return undefined!;
  };
}
