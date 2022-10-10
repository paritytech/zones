import { UntypedError } from "./common.ts";
import {
  E,
  Effect,
  EffectId,
  EffectLike,
  EffectState,
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
    const p = new Process(props, apply);
    const rootState = p.ensureStates(root)!;
    return rootState.getResult() as any;
  };
}

export interface Run<GlobalApplies extends PlaceholderApplied[]> {
  <
    Root extends EffectLike,
  >(
    root: Root,
    apply?: PlaceholderApplied<
      Exclude<V<Root>, GlobalApplies[number]["placeholder"]>
    >[], // TODO: ensure each placeholder is accounted for exactly once
  ): Promise<E<Root> | UntypedError | T<Root>>;
}

export class Process extends Map<EffectId, EffectState> {
  constructor(
    readonly props: RunProps | undefined,
    readonly apply: unknown, // TODO
  ) {
    super();
  }

  ensureState = (source: Effect): EffectState => {
    let state = this.get(source.id);
    if (!state) {
      state = source.state(this);
      this.set(source.id, state);
    }
    return state;
  };

  ensureStates = (root: EffectLike): EffectState => {
    while (root instanceof Name) {
      root = root.root;
    }
    const rootState = this.ensureState(root);
    const instate: [source: EffectLike, parentState: EffectState][] = [];
    const pushChildren = (currentState: EffectState) => {
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
        currentState.addDependent(parentState);
        pushChildren(currentState);
      }
    }
    return rootState;
  };
}
