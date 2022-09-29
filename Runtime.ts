import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { deferred } from "./deps/std/async.ts";
import { EffectId } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { Name } from "./Name.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { Work } from "./Work.ts";

export interface RuntimeProps {
  hooks?: Hooks[];
}

export function runtime(props?: RuntimeProps): Runtime {
  return <
    S extends boolean,
    V,
    E extends Error,
    T,
  >(
    root: EffectLike<S, V, E, T>,
    ...[env]: unknown extends V ? [] : [env: V]
  ) => {
    const context = new RuntimeContext(props, root, env);
    const rootWork = context.get(root.id)!;
    return rootWork.init() as ColoredResult<S, E | T>;
  };
}

export type Runtime = <
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

export class RuntimeContext extends Map<EffectId, Work> {
  dependents = new Map<EffectId, Set<EffectId>>();
  trap = deferred<Error>();

  constructor(
    readonly props: RuntimeProps | undefined,
    readonly root: EffectLike,
    readonly env: unknown,
  ) {
    super();
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
        const dependents = this.dependents.get(source.id);
        if (dependents) {
          dependents.add(parentId);
        } else {
          this.dependents.set(source.id, new Set([parentId]));
        }
      }
    }
  }
}
