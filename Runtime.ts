import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { Deferred, deferred } from "./deps/std/async.ts";
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
    return new RuntimeContext(props, root, env)
      .coloredResult() as ColoredResult<S, E | T>;
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

export class RuntimeContext {
  #work = new Map<EffectId, Work>();
  #dependents = new Map<EffectId, Set<EffectId>>();
  #error?: Deferred<Error>;

  constructor(
    readonly props: RuntimeProps | undefined,
    readonly root: EffectLike,
    readonly env: unknown,
  ) {
    this.register(root);
  }

  get error(): Deferred<Error> {
    if (!this.#error) {
      this.#error = deferred();
    }
    return this.#error;
  }

  register = (root: EffectLike): void => {
    const visit: [source: EffectLike, parentId?: EffectId][] = [[root]];
    while (visit.length) {
      const [source, parentId] = visit.pop()!;
      if (source instanceof Name) {
        visit.push([source.root, parentId]);
        continue;
      }
      let work = this.#work.get(source.id);
      if (!work) {
        work = source.work(this);
        this.#work.set(source.id, work);
      }
      if (source instanceof Atom) {
        source.args.forEach((arg) => {
          if (isEffectLike(arg)) {
            visit.push([arg, source.id]);
          }
        });
      }
      if (parentId) {
        this.#addDependent(source.id, parentId);
      }
    }
  };

  work = (effectId: EffectId): Work => {
    return this.#work.get(effectId)!;
  };

  result = (effectId: EffectId): unknown => {
    return this.work(effectId).result();
  };

  dependents = (effectId: EffectId): Set<EffectId> | undefined => {
    return this.#dependents.get(effectId);
  };

  reject = (error: Error): void => {
    this.error.reject(error);
  };

  coloredResult = () => {
    return Promise.race([
      this.error,
      this.result(this.root.id),
    ]);
  };

  #addDependent = (
    childId: EffectId,
    parentId: EffectId,
  ): void => {
    const dependents = this.#dependents.get(childId);
    if (dependents) {
      dependents.add(parentId);
    } else {
      this.#dependents.set(childId, new Set([parentId]));
    }
  };
}
