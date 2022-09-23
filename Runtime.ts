import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { EffectId } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { Name } from "./Name.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { Work } from "./Work.ts";

export interface RunProps {
  hooks?: Hooks[];
}

export function run(props?: RunProps): Run {
  const contexts = new WeakMap<object, Context>();
  return <
    S extends boolean,
    V,
    E extends Error,
    T,
  >(
    root: EffectLike<S, V, E, T>,
    ...[env]: unknown extends V ? [] : [env: V]
  ) => {
    const key = typeof env === "function" || typeof env === "object" ? env : {};
    let context = contexts.get(key);
    if (!context) {
      context = new Context(props, env);
      contexts.set(key, context);
    }
    const state = context.state(root);
    return context.get(root.id)!.enter(state) as ColoredResult<S, E | T>;
  };
}

export type Run = <
  S extends boolean,
  V,
  E extends Error,
  T,
>(
  root: EffectLike<S, V, E, T>,
  ...[env]: unknown extends V ? [] : [env: V]
) => ColoredResult<S, UnexpectedThrow | E | T>;

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;

export class RunState {
  result: unknown;
  dependents = new Map<EffectId, Set<EffectId>>();

  relate = (
    child: EffectId,
    parent: EffectId,
  ) => {
    const dependents = this.dependents.get(child);
    if (dependents) {
      dependents.add(parent);
    } else {
      this.dependents.set(child, new Set([parent]));
    }
  };
}

export class Context extends Map<EffectId, Work> {
  constructor(
    readonly props: RunProps | undefined,
    readonly env: unknown,
  ) {
    super();
  }

  state = (root: EffectLike): RunState => {
    const state = new RunState();
    const visit: [source: EffectLike, parentId?: EffectId][] = [[root]];
    while (visit.length) {
      const [source, parentId] = visit.pop()!;
      if (source instanceof Name) {
        visit.push([source.root, parentId]);
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
            visit.push([arg, source.id]);
          }
        });
      }
      if (parentId) {
        state.relate(source.id, parentId);
      }
    }
    return state;
  };
}
