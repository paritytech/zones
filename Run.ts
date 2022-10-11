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
import { then, tryForEach, UntypedError } from "./util/mod.ts";

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
    return rootState.result as any;
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

export class RunState {
  static YET_TO_RUN = Symbol();

  declare isRoot?: true;

  #runResult: unknown = RunState.YET_TO_RUN;

  dependents = new Set<RunState>();

  constructor(
    readonly process: Process,
    readonly source: Effect,
  ) {}

  get result(): unknown {
    if (this.#runResult === RunState.YET_TO_RUN) {
      this.#runResult = then(this.source.enter(this), (ok) => {
        if (this.source.dependencies) {
          tryForEach([...this.source.dependencies.values()], ({ id }) => {
            const depState = this.process.get(id)!;
            depState.dependents.delete(this);
            if (!depState.dependents.size) {
              console.log(depState.source.id);
            }
          });
        }
        return ok;
      });
    }
    return this.#runResult;
  }
}

export class Process extends Map<EffectId, RunState> {
  constructor(
    readonly props: RunProps | undefined,
    readonly apply: unknown, // TODO
  ) {
    super();
  }

  ensureState = (source: Effect): RunState => {
    let state = this.get(source.id);
    if (!state) {
      state = new RunState(this, source);
      this.set(source.id, state);
    }
    return state;
  };

  ensureStates = (root: EffectLike): RunState => {
    while (root instanceof Name) {
      root = root.root;
    }
    const rootState = this.ensureState(root);
    const instate: [source: EffectLike, parentState: RunState][] = [];
    const pushChildren = (currentState: RunState) => {
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
