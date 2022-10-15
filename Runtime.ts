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
import { UntypedError } from "./Error.ts";
import {
  EnsureSoleApplies,
  FlattenApplies,
  flattenApplies,
  isPlaceholder,
  PlaceholderApplied,
} from "./Placeholder.ts";
import * as U from "./util/mod.ts";

// TODO: why isn't this behaving properly? Perhaps because the arg doesn't reference a type param from the `run` scope?
export interface RunProps {
  // apply?: EnsureSoleApplies<PlaceholderApplied[]>;
  apply?: PlaceholderApplied[];
}
export namespace RunProps {
  export type GlobalApplyKey<P extends RunProps | undefined> = Exclude<
    Exclude<P, undefined>["apply"],
    undefined
  >[number]["placeholder"]["key"];
}

// TODO: the placeholder application stage typing needs love
// TODO: re-think some of the placeholder/applied/misc. naming
export function runtime<PropsRest extends [props?: RunProps]>(
  ...[props]: PropsRest
): Runtime<PropsRest[0]> {
  return (root, apply?) => {
    const process = new Process(props, apply as any);
    const rootState = process.instate(root);
    return rootState.result as any;
  };
}

export interface Runtime<
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

const result_ = Symbol();

export class RunState {
  declare [result_]: unknown;

  dependents = new Set<RunState>();

  constructor(
    readonly process: Process,
    readonly source: Effect,
  ) {}

  get result(): unknown {
    if (!(result_ in this)) {
      this[result_] = U.thenOk(this.source.run(this), (enterResult) => {
        if (this.source.dependencies) {
          [...this.source.dependencies.values()].forEach((depSource) => {
            const depState = this.process.state(depSource);
            depState.dependents.delete(this);
          });
        }
        return enterResult;
      });
    }
    return this[result_];
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

  // TODO: is `instate` is a strange name? Doesn't really matter... still.
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
    return isEffectLike(x)
      ? this.state(x)!.result
      : isPlaceholder(x)
      ? this.applies[x.key]
      : x;
  };
}
