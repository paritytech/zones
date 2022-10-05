import { Atom } from "./Atom.ts";
import { EffectLike, isEffectLike } from "./common.ts";
import { unimplemented } from "./deps/std/testing/asserts.ts";
import { EffectId } from "./Effect.ts";
import { Name } from "./Name.ts";
import { RuntimeProps } from "./Runtime.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";

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
      } else if (!(source instanceof Atom)) {
        unimplemented();
      }
      let state = this.get(source.id);
      if (!state) {
        state = new EffectState(this, source);
        this.set(source.id, state);
      }
      if (source instanceof Atom) {
        for (const arg of source.args) {
          if (isEffectLike(arg)) {
            init.push([arg, state]);
          }
        }
      }
      if (parentState) {
        state.dependents.add(parentState);
      }
    }
  }

  result = (): unknown => {
    const rootState: EffectState = this.values().next().value;
    rootState.run();
    return rootState.result;
  };
}

export class EffectState {
  dependents = new Set<EffectState>();

  declare childEnter?: Promise<Error | unknown[]>;
  declare enter?: Promise<unknown>;
  declare childExit?: Promise<Error | void>;
  declare exit?: Promise<unknown>;
  declare result?: Promise<unknown>;

  constructor(
    readonly process: Process,
    readonly source: Atom,
  ) {}

  run = () => {
    if (!this.result) {
      this.#childEnter();
      this.#enter();
      this.#childExit();
      this.#exit();
      this.#result();
    }
  };

  #childEnter = (): void => {
    const args: unknown[] = [];
    let errorContainer: undefined | { i: number; error: Error };
    for (let i = 0; i < this.source.args.length; i++) {
      const arg = this.source.args[i]!;
      if (isEffectLike(arg)) {
        const state = this.process.get(arg.id)!;
        state.run();
        args.push(state.enter!.then((result) => {
          if (result instanceof Error) {
            if (!errorContainer || errorContainer.i < i) {
              errorContainer = { i, error: result };
            }
          }
          return result;
        }));
      } else {
        args.push(arg);
      }
    }
    this.childEnter = Promise.all(args).then((result) => {
      return errorContainer?.error || result;
    });
  };

  #enter = (): void => {
    this.enter = this.#handleUnexpectedThrow(async () => {
      const args = await this.childEnter!;
      if (args instanceof Error) return args;
      return await this.source.enter.bind(this.process.env)(...args);
    });
  };

  #childExit = (): void => {
    this.childExit = (async () => {
      await this.enter!;
      const exits: Promise<unknown>[] = [];
      let errorContainer: undefined | { i: number; error: Error };
      for (let i = 0; i < this.source.args.length; i++) {
        const arg = this.source.args[i]!;
        if (isEffectLike(arg)) {
          const argState = this.process.get(arg.id)!;
          argState.dependents.delete(this);
          argState.#exit();
          exits.push(argState.exit!.then((result) => {
            if (result instanceof Error) {
              if (!errorContainer || errorContainer.i < i) {
                errorContainer = { i, error: result };
              }
            }
            return result;
          }));
        }
      }
      this.childExit = Promise.all(exits).then(() => {
        return errorContainer?.error;
      });
    })();
  };

  #exit = () => {
    if (!("exit" in this)) {
      if (!this.source.exit) {
        this.exit = Promise.resolve();
      } else if (!this.dependents.size) {
        this.exit = this.#handleUnexpectedThrow(async () => {
          return await this.source.exit.bind(this.process.env)(
            await this.enter,
          );
        });
      }
    }
  };

  #result = () => {
    this.result = (async () => {
      await this.childEnter;
      const enter = await this.enter;
      await this.childExit;
      await this.exit;
      return enter;
    })();
  };

  #handleUnexpectedThrow = async (fn: () => unknown): Promise<unknown> => {
    try {
      return await fn();
    } catch (e) {
      return new UnexpectedThrow(e, this.source);
    }
  };
}
