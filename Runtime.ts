import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { EffectId } from "./Effect.ts";
import { EffectState } from "./EffectState.ts";
import { Name } from "./Name.ts";

export class Runtime {
  #contexts = new WeakMap<object, Context>();

  // TODO: enable hooking into context for rewrites
  run = <S extends boolean, V, E extends Error, T>(
    root: EffectLike<S, V, E, T>,
    env: unknown extends V ? object : V,
  ): ColoredResult<S, E | T> => {
    const envSafe = env as object; // for now
    let context = this.#contexts.get(envSafe);
    if (!context) {
      context = new Context(envSafe);
      this.#contexts.set(envSafe, context);
    }
    return context.getState(root).run() as ColoredResult<S, E | T>;
  };
}

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;

export class Context {
  states = new Map<EffectId, EffectState>();

  constructor(readonly env: object) {}

  getState = (root: EffectLike): EffectState => {
    const stack: [source: EffectLike, parentId?: EffectId][] = [[root]];
    while (stack.length) {
      const [source, parentId] = stack.pop()!;
      if (source instanceof Name) {
        stack.push([source.root, parentId]);
        continue;
      }
      if (source instanceof Atom) {
        source.args.forEach((arg) => {
          if (isEffectLike(arg)) {
            stack.push([arg, source.id]);
          }
        });
      }
      let state = this.states.get(source.id);
      if (!state) {
        state = source.state(this);
        this.states.set(source.id, state);
      }
      if (parentId) {
        state.addDependent(parentId);
      }
    }
    return this.states.get(root.id)!;
  };
}
