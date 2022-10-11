import { UntypedError } from "./common.ts";
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

export class EffectRunState<E extends Effect = Effect> {
  declare isRoot?: true;
  declare runResult?: unknown;

  dependents = new Set<EffectRunState>();

  constructor(
    readonly process: Process,
    readonly source: E,
  ) {}

  get result(): unknown {
    if (!("prev" in this)) {
      this.runResult = this.source.run(this);
    }
    return this.runResult;
  }
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
