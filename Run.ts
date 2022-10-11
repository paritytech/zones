import { ExitResult, then, tryForEach, UntypedError } from "./common.ts";
import {
  E,
  Effect,
  EffectId,
  EffectLike,
  isEffectLike,
  Name,
  T,
  V,
} from "./Effect.ts";
import { PlaceholderApplied } from "./Placeholder.ts";

export interface RunProps<
  GlobalApplies extends PlaceholderApplied[] = PlaceholderApplied[],
> {
  apply?: GlobalApplies; // TODO(@tjjfvi): type-level repeat check
  hooks?: "TODO";
}

export function run<GlobalApply extends PlaceholderApplied[]>(
  props?: RunProps<GlobalApply>,
): Run<GlobalApply> {
  return (root: EffectLike, apply) => {
    const process = new Process(props, apply);
    const rootState = process.ensureStates(root)!;
    rootState.isRoot = true;
    const result = rootState.result;
    rootState.exit();
    return result as any;
  };
}

export interface Run<GlobalApplies extends PlaceholderApplied[]> {
  <Root extends EffectLike>(
    root: Root,
    apply?: PlaceholderApplied<
      Exclude<V<Root>, GlobalApplies[number]["placeholder"]>
    >[], // TODO: ensure each placeholder is accounted for exactly once
  ): Promise<E<Root> | UntypedError | T<Root>>;
}

export class EffectRunState<E extends Effect = Effect> {
  static YET_TO_RUN = Symbol();

  declare isRoot?: true;

  #runResult: unknown = EffectRunState.YET_TO_RUN;
  #exitCbs? = new Set<(resolved: unknown) => ExitResult>();

  dependents = new Set<EffectRunState>();

  constructor(
    readonly process: Process,
    readonly source: E,
  ) {}

  get result(): unknown {
    if (this.#runResult === EffectRunState.YET_TO_RUN) {
      this.#runResult = then(this.source.run(this), (ok) => {
        return this.source.dependencies
          ? then(
            tryForEach(
              [...this.source.dependencies],
              ({ id }) => {
                const depState = this.process.get(id)!;
                depState.dependents.delete(this);
                if (!depState.dependents.size) {
                  return depState.exit();
                }
              },
            ),
            () => ok,
          )
          : ok;
      });
    }
    return this.#runResult;
  }

  exit = () => {
    return then(this.result, (r) => {
      if (this.#exitCbs) {
        return then(
          tryForEach([...this.#exitCbs.values()], (cb) => cb(r)),
          () => r,
        );
      }
      return r;
    });
  };

  attachExitCb = (cb: (value: unknown) => ExitResult) => {
    if (this.#exitCbs) {
      this.#exitCbs.add(cb);
    } else {
      this.#exitCbs = new Set([cb]);
    }
  };
}

export class Process extends Map<EffectId, EffectRunState> {
  constructor(
    readonly props: RunProps | undefined,
    readonly apply: unknown, // TODO
  ) {
    super();
  }

  result = (id: EffectId): unknown => {
    return this.get(id)!.result;
  };

  ensureState = (source: Effect): EffectRunState => {
    let state = this.get(source.id);
    if (!state) {
      state = new EffectRunState(this, source);
      this.set(source.id, state);
    }
    return state;
  };

  ensureStates = (root: EffectLike): EffectRunState => {
    while (root instanceof Name) {
      root = root.root;
    }
    const rootState = this.ensureState(root);
    const instate: [source: EffectLike, parentState: EffectRunState][] = [];
    const pushChildren = (currentState: EffectRunState) => {
      currentState.source.args?.forEach((arg) => {
        if (isEffectLike(arg)) {
          instate.push([arg, currentState]);
        }
      });
    };
    pushChildren(rootState);
    while (instate.length) {
      const [currentSource, parentState] = instate.pop()!;
      if (currentSource instanceof Name) {
        instate.push([currentSource.root, parentState]);
        continue;
      } else {
        const currentState = this.ensureState(currentSource);
        currentState.dependents.add(parentState);
        pushChildren(currentState);
      }
    }
    return rootState;
  };
}
