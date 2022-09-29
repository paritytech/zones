import { Atom } from "./Atom.ts";
import {
  ExitResult,
  ExitStatus,
  ExitStatusPending,
  isEffectLike,
} from "./common.ts";
import { Deferred, deferred } from "./deps/std/async.ts";
import { EffectId } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { assertKnownWork, noop } from "./util.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  declare enterResult?: unknown;
  declare exitResult?: ExitResult;

  init = () => {
    if (!("enterResult" in this)) {
      const args = this.#args();
      this.enterResult = args.then(this.#enter);
    }
    return this.enterResult;
  };

  #args = (): Promise<unknown[]> => {
    const buffer: unknown[] = [];
    for (const arg of this.source.args) {
      if (isEffectLike(arg)) {
        const argEnterResult = this.context.get(arg.id)!.init();
        buffer.push(argEnterResult);
      } else {
        buffer.push(arg);
      }
    }
    return Promise.all(buffer);
  };

  #enter = async (args: unknown[]): Promise<unknown> => {
    try {
      return await this.source.enter.bind(this.context.env)(...args);
    } catch (e) {
      return new UnexpectedThrow(e, this);
    }
  };

  #exitArgs = () => {
    if (this.source.dependencies) {
      const argExitPendings: ExitResult[] = [];
      for (const dependency of this.source.dependencies) {
        argExitPendings.push(this.#exitArg(dependency.id));
      }
      return Promise.all(argExitPendings).then((exitStatuses) => {
        for (const exitStatus of exitStatuses) {
          if (exitStatus instanceof Error) {
            return exitStatus;
          }
        }
        return;
      });
    }
    return;
  };

  #exitArg = (id: EffectId) => {
    const dependencyWork = this.context.get(id)!;
    assertKnownWork(dependencyWork);
    return dependencyWork.exit();
  };

  exit = () => {
    if (!("exitResult" in this)) {
      if (this.source.exit === noop) {
        this.exitResult = Promise.resolve() as Deferred<void>;
      } else {
        this.exitResult = deferred<ExitStatus>();
        const dependents = this.context.dependents.get(this.source.id);
        if (!dependents?.size) {
          this.#catchUnexpectedThrow(async () => {
            const enterResult = await this.init();
            return this.source.exit.bind(this.context.env)(enterResult);
          });
        }
      }
    }
    return this.exitResult;
  };

  // hook = <W extends keyof Hooks>(which: W) => {
  //   const hooks = this.context.props?.hooks;
  //   if (hooks) {
  //     let pending: ExitStatusPending | undefined;
  //     for (const { [which]: hook } of hooks) {
  //       if (hook) {
  //         const hookResult = hook?.(
  //           this,
  //           {
  //             enter: this.enterResult,
  //             exit: this.exitResult,
  //           }[which] as ExitStatus,
  //         );
  //         if (hookResult instanceof Error) {
  //           return hookResult;
  //         } else if (hookResult instanceof Promise) {}
  //       }
  //     }
  //   }
  // };
}
