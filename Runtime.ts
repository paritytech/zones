import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { EffectId } from "./Effect.ts";
import { Name } from "./Name.ts";
import { TinyGraph } from "./util.ts";
import { Work } from "./Work.ts";

export class State {
  dependents = new TinyGraph<EffectId>();

  relate = (
    parentId: EffectId,
    childId: EffectId,
  ) => {
    this.dependents.arrow(childId, parentId);
  };
}

export class Context extends Map<EffectId, Work> {
  constructor(readonly env: unknown) {
    super();
  }

  state = (root: EffectLike): State => {
    const state = new State();
    const stack: [source: EffectLike, parentId?: EffectId][] = [[root]];
    while (stack.length) {
      const [source, parentId] = stack.pop()!;
      if (source instanceof Name) {
        stack.push([source.root, parentId]);
        continue;
      }
      let work = this.get(source.id);
      if (!work) {
        work = source.work(this);
        this.set(source.id, work);
      }
      if (source instanceof Atom) {
        source.args.forEach((arg) => {
          if (isEffectLike(arg)) {
            stack.push([arg, source.id]);
          }
        });
      }
      if (parentId) {
        state.relate(parentId, source.id);
      }
    }
    return state;
  };
}

// TODO: enable hooking into context for rewrites
export class Runtime extends WeakMap<object, Context> {
  run = <
    S extends boolean,
    V,
    E extends Error,
    T,
  >(
    root: EffectLike<S, V, E, T>,
    ...[env]: unknown extends V ? [] : [env: V]
  ): ColoredResult<S, E | T> => {
    const key = typeof env === "function" || typeof env === "object" ? env : {};
    let context = this.get(key);
    if (!context) {
      context = new Context(env);
      this.set(key, context);
    }
    const flightPlan = context.state(root);
    return context.get(root.id)!.enter(flightPlan) as ColoredResult<S, E | T>;
  };
}

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;
