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
    return new Process(props, apply as any).init(root)() as any;
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

export class Process extends Map<EffectId, () => unknown> {
  #applies;
  #context = new Map<new() => unknown, unknown>();

  constructor(
    readonly props: RunProps | undefined,
    localApply:
      | undefined
      | ((
        use: (...applies: PlaceholderApplied[]) => Record<PropertyKey, unknown>,
      ) => Record<PropertyKey, unknown>),
  ) {
    super();
    this.#applies = {
      ...props?.apply && flattenApplies(...props.apply),
      ...localApply && localApply(flattenApplies),
    };
  }

  #ensureRun = (source: Effect) => {
    let run = this.get(source.id);
    if (!run) {
      run = source.run(this);
      this.set(source.id, run);
    }
    return run;
  };

  init = (root: EffectLike) => {
    while (root instanceof Name) {
      root = root.root;
    }
    const rootRun = this.#ensureRun(root);
    const stack: EffectLike[] = [];
    const pushChildren = (current: Effect) => {
      current.args?.forEach((arg) => {
        if (isEffectLike(arg)) {
          stack.push(arg);
        }
      });
    };
    pushChildren(root);
    while (stack.length) {
      const currentSource = stack.pop()!;
      if (currentSource instanceof Name) {
        stack.push(currentSource.root);
        continue;
      } else {
        this.#ensureRun(currentSource);
        pushChildren(currentSource);
      }
    }
    return rootRun;
  };

  run = (effect: EffectLike) => {
    return this.get(effect.id)!;
  };

  resolve = (x: unknown) => {
    return isEffectLike(x)
      ? this.run(x)!()
      : isPlaceholder(x)
      ? this.#applies[x.key]
      : x;
  };

  context = <T>(ctor: new() => T): T => {
    let instance = this.#context.get(ctor) as undefined | T;
    if (!instance) {
      instance = new ctor();
      this.#context.set(ctor, instance);
    }
    return instance;
  };
}
