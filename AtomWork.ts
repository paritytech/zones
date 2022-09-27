import { Atom } from "./Atom.ts";
import {
  ExitResult,
  ExitStatus,
  ExitStatusPending,
  isEffectLike,
} from "./common.ts";
import { Deferred, deferred } from "./deps/std/async.ts";
import { assert } from "./deps/std/testing/asserts.ts";
import { EffectId } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { RunState } from "./Runtime.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { assertKnownWork, noop, uninitialized } from "./util.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  enterResult: unknown = uninitialized;
  exitResult: uninitialized | Deferred<ExitStatus> = uninitialized;

  enter = (state: RunState) => {
    if (this.enterResult === uninitialized) {
      const argPendings: unknown[] = [];
      for (const arg of this.source.args) {
        if (isEffectLike(arg)) {
          argPendings.push(this.#enterArg(state, arg.id));
        } else {
          argPendings.push(arg);
        }
      }
      this.enterResult = Promise.race([
        state.trap,
        this.#enter(state, argPendings),
      ]);
    }
    return this.enterResult;
  };

  #enterArg = (
    state: RunState,
    id: EffectId,
  ) => {
    const argWork = this.context.get(id)!;
    const argWorkEnterResult = argWork.enter(state);
  };

  #enter = async (
    state: RunState,
    args: unknown[],
  ) => {
    const argResolveds = await Promise.all(args);
    for (const argResolved of argResolveds) {
      if (argResolved instanceof Error) {
        return argResolved;
      }
    }
    const enterResult = this.#catchUnexpectedThrow(() => {
      return this.source.enter.bind(this.context.env)(...argResolveds);
    });
    const exitResult = await this.#catchUnexpectedThrow(() => {
      return this.#argExits(state);
    });
    // exit here if root or enterResult is error
    if (exitResult instanceof Error) {
      return exitResult;
    }
    return enterResult;
  };

  #argExits = (state: RunState) => {
    if (this.source.dependencies) {
      const argExitPendings: ExitStatusPending[] = [];
      for (const dependency of this.source.dependencies) {
        const dependencyWork = this.context.get(dependency.id)!;
        assertKnownWork(dependencyWork);
        const exitResult = dependencyWork.exit(state);
        if (exitResult instanceof Error) {
          return exitResult;
        } else if (exitResult instanceof Promise) {
          argExitPendings.push(exitResult);
        }
      }
      if (argExitPendings.length) {
        return Promise.all(argExitPendings).then((exitStatuses) => {
          for (const exitStatus of exitStatuses) {
            if (exitStatus instanceof Error) {
              return exitStatus;
            }
          }
          return;
        });
      }
    }
    return;
  };

  exit = (state: RunState) => {
    if (this.exitResult === uninitialized) {
      if (this.source.exit === noop) {
        this.exitResult = Promise.resolve() as Deferred<void>;
      } else {
        this.exitResult = deferred<ExitStatus>();
        const dependents = state.dependents.get(this.source.id);
        if (!dependents?.size) {
          this.#catchUnexpectedThrow(async () => {
            const enterResult = await this.enter(state);
            return this.source.exit.bind(this.context.env)(enterResult);
          });
        }
      }
    }
    return this.exitResult;
  };

  #catchUnexpectedThrow = <T>(
    run: () => T | Promise<T>,
  ): T | UnexpectedThrow | Promise<T | UnexpectedThrow> => {
    try {
      const runResult = run();
      if (runResult instanceof Promise) {
        return (async () => {
          try {
            return await runResult;
          } catch (thrown) {
            return new UnexpectedThrow(thrown, this);
          }
        })();
      }
      return runResult;
    } catch (thrown) {
      return new UnexpectedThrow(thrown, this);
    }
  };

  // hook = (which: keyof Hooks) => {
  //   return this.context.props?.hooks?.reduce(async (acc, hooks) => {
  //     await acc;
  //     const hook = hooks?.[which];
  //     if (hook) {
  //       const hookResult = hook(this.source, await this.enterResult);
  //       if (hookResult instanceof Promise) {
  //         await hookResult;
  //       }
  //       return hookResult;
  //     }
  //   }, Promise.resolve());
  // };
}
