// TODO: clean up these typings
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
import {
  EnsureSoleApplies,
  FlattenApplies,
  flattenApplies,
  isPlaceholder,
  PlaceholderApplied,
} from "./Placeholder.ts";
import { then, tryForEach, UntypedError } from "./util/mod.ts";

export interface RunProps {
  // TODO: why isn't this behaving properly? Perhaps because the arg doesn't reference a type param from the `run` scope?
  // apply?: EnsureSoleApplies<PlaceholderApplied[]>;
  apply?: PlaceholderApplied[];
}
export namespace RunProps {
  export type GlobalApplyKey<P extends RunProps | undefined> = Exclude<
    Exclude<P, undefined>["apply"],
    undefined
  >[number]["placeholder"]["key"];
}

export function run<PropsRest extends [props?: RunProps]>(
  ...[props]: PropsRest
): Run<PropsRest[0]> {
  return (root, apply?) => {
    return new Process(props, apply as any).instate(root).result as any;
  };
}

export interface Run<
  Props extends RunProps | undefined,
  GlobalApplyKey extends RunProps.GlobalApplyKey<Props> =
    RunProps.GlobalApplyKey<Props>,
> {
  <
    Root extends EffectLike,
    RootV extends V<Root> = V<Root>,
  >(
    root: Root,
    ...rest: [Exclude<RootV["key"], GlobalApplyKey>] extends [never] ? []
      : [
        useApplies: (
          use: <A extends PlaceholderApplied[]>(
            ...applies: EnsureSoleApplies<A>
          ) => FlattenApplies<A[number]>,
        ) => Omit<FlattenApplies<PlaceholderApplied<RootV>>, GlobalApplyKey>,
      ]
  ): Promise<E<Root> | UntypedError | T<Root>>;
}

export class RunState {
  static YET_TO_RUN = Symbol();

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
            // TODO: trigger exits (important for `Drop`)
            if (!depState.dependents.size) {}
          });
        }
        return ok;
      });
    }
    return this.#runResult;
  }
}

export class Process extends Map<EffectId, RunState> {
  applies;

  constructor(
    readonly props: RunProps | undefined,
    localApply:
      | undefined
      | ((
        use: (...applies: PlaceholderApplied[]) => Record<PropertyKey, unknown>,
      ) => Record<PropertyKey, unknown>),
  ) {
    super();
    this.applies = {
      ...props?.apply && flattenApplies(...props.apply),
      ...localApply && localApply(flattenApplies),
    };
  }

  instate = (root: EffectLike): RunState => {
    while (root instanceof Name) {
      root = root.root;
    }
    const rootState = this.#ensureState(root);
    const stack: [source: EffectLike, parentState: RunState][] = [];
    const pushChildren = (currentState: RunState) => {
      currentState.source.args?.forEach((arg) => {
        if (isEffectLike(arg)) {
          stack.push([arg, currentState]);
        }
      });
    };
    pushChildren(rootState);
    while (stack.length) {
      const [currentSource, parentState] = stack.pop()!;
      if (currentSource instanceof Name) {
        stack.push([currentSource.root, parentState]);
        continue;
      } else {
        const currentState = this.#ensureState(currentSource);
        currentState.dependents.add(parentState);
        pushChildren(currentState);
      }
    }
    return rootState;
  };

  #ensureState = (source: Effect): RunState => {
    let state = this.get(source.id);
    if (!state) {
      state = new RunState(this, source);
      this.set(source.id, state);
    }
    return state;
  };

  state = (effect: EffectLike): RunState => {
    return this.get(effect.id)!;
  };

  resolve = (x: unknown) => {
    return (isEffectLike(x))
      ? this.state(x)!.result
      : isPlaceholder(x)
      ? this.applies[x.key]
      : x;
  };
}
