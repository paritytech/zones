import { Call } from "./Atom.ts";
import { List, Rec } from "./collections/mod.ts";
import { unimplemented } from "./deps/std/testing/asserts.ts";
import {
  EffectId,
  EffectLike,
  EffectState,
  isEffectLike,
  Name,
} from "./Effect.ts";
import { Hooks } from "./Hooks.ts";

export interface RuntimeProps {
  hooks?: Hooks[];
}

export class Runtime {
  constructor(readonly props?: RuntimeProps) {}

  run = <
    S extends boolean,
    V,
    E extends Error,
    T,
  >(
    root: EffectLike<S, V, E, T>,
    ...[env]: unknown extends V ? [] : [env: V]
  ) => {
    return new Process(this.props, root, env)
      .result() as ColoredResult<S, E | T>;
  };
}

export type ColoredResult<S extends boolean, R> = false extends S ? Promise<R>
  : R;

export class Process extends Map<EffectId, EffectState> {
  constructor(
    readonly props: RuntimeProps | undefined,
    readonly root: EffectLike,
    readonly env: unknown,
  ) {
    super();
    const init: [source: EffectLike, parentState?: EffectState][] = [[root]];
    while (init.length) {
      const [source, parentState] = init.pop()!;
      if (source instanceof Name) {
        init.push([source.root, parentState]);
        continue;
      } else if (
        !(source instanceof Call
          || source instanceof List
          || source instanceof Rec)
      ) {
        unimplemented();
      }
      let state = this.get(source.id);
      if (!state) {
        state = source.state(this);
        this.set(source.id, state);
      }
      if (source instanceof Call && isEffectLike(source.dep)) {
        init.push([source.dep, state]);
      }
      if (parentState) {
        state.dependents.add(parentState);
      }
    }
  }

  result = (): unknown => {
    return (this.values().next().value as EffectState).result();
  };
}
