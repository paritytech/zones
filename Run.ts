import { RuneError } from "./common.ts";
import {
  E,
  Effect,
  EffectEnv,
  EffectId,
  EffectLike,
  EffectState,
  isEffectLike,
  Name,
  T,
} from "./Effect.ts";
import { Call, Rec } from "./intrinsics/mod.ts";
import { PlaceholderApplied } from "./Placeholder.ts";

export interface RunProps {
  apply?: PlaceholderApplied[]; // TODO(@tjjfvi): type-level repeat check
  hooks?: "TODO";
}

export function run(props?: RunProps): Run {
  return (root: EffectLike, apply) => {
    const process = new Process(props, apply);
    while (root instanceof Name) {
      root = root.root;
    }
    const rootState = process.ensureState(root);
    const instate: [source: EffectLike, parentState: EffectState][] = [];
    pushChildren(root, rootState);
    while (instate.length) {
      const [currentSource, parentState] = instate.pop()!;
      if (currentSource instanceof Name) {
        instate.push([currentSource.root, parentState]);
        continue;
      } else {
        const currentState = process.ensureState(currentSource);
        currentState.dependents.add(parentState);
        pushChildren(currentSource, currentState);
      }
    }
    return rootState.result() as any;

    function pushChildren(currentSource: Effect, currentState: EffectState) {
      if (currentSource instanceof Call && isEffectLike(currentSource.dep)) {
        instate.push([currentSource.dep, currentState]);
      } else if (currentSource instanceof Rec) {
        for (const value of currentSource.fields) {
          if (isEffectLike(value)) {
            instate.push([value, currentState]);
          }
        }
      }
    }
  };
}

export type Run = <Root extends EffectLike>(
  root: Root,
  apply: EffectEnv, /* TODO */
) => Promise<E<Root> | UnexpectedInnerError | T<Root>>;

export class Process extends Map<EffectId, EffectState> {
  constructor(
    readonly props: RunProps | undefined,
    readonly apply: EffectEnv,
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
}

const UNEXPECTED_INNER_ERROR = "UnexpectedInnerError";
const UNEXPECTED_INNER_ERROR_MSG = "";
export class UnexpectedInnerError
  extends RuneError<typeof UNEXPECTED_INNER_ERROR>
{
  constructor() {
    super(UNEXPECTED_INNER_ERROR, UNEXPECTED_INNER_ERROR_MSG);
  }
}
