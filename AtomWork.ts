import { Atom } from "./Atom.ts";
import { ExitResult, isEffectLike } from "./common.ts";
import { State } from "./Runtime.ts";
import { UnknownError } from "./UnknownError.ts";
import { noop, uninitialized } from "./util.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  enterResult: unknown = uninitialized;
  exitResult: uninitialized | ExitResult = uninitialized;

  enter = (state: State) => {
    if (this.enterResult === uninitialized) {
      const args: unknown[] = [];
      for (const arg of this.source.args) {
        if (isEffectLike(arg)) {
          const argEnterResult = this.context.get(arg.id)!.enter(state);
          if (argEnterResult instanceof Error) {
            this.enterResult = argEnterResult;
            return this.enterResult;
          }
          args.push(argEnterResult);
        } else {
          args.push(arg);
        }
      }
      const enter = this.source.enter.bind(this.context.env);
      try {
        this.enterResult = enter(...args);
      } catch (err) {
        this.enterResult = new UnknownError(err, this.source);
      }
      this.source.dependencies?.forEach(({ id }) => {
        const dependencyDependentIds = state.dependents.get(id);
        dependencyDependentIds?.delete(this.source.id);
        if (!dependencyDependentIds?.size) {
          const dependency = this.context.get(id)!;
          if (dependency instanceof AtomWork) {
            dependency.exitResult = dependency.exit(state);
          }
        }
      });
      if (
        this.enterResult instanceof Error
        || !state.dependents.get(this.source.id)?.size
      ) {
        this.exitResult = this.exit(state);
      }
    }
    return this.enterResult;
  };

  exit = (_state: State) => {
    if (this.enterResult === uninitialized) {
      return;
    }
    if (this.exitResult === uninitialized) {
      if (this.source.exit === noop) {
        this.exitResult = undefined;
      } else {
        const exit = this.source.exit.bind(this.context.env);
        this.exitResult = exit(this.enterResult);
      }
    }
    return this.exitResult;
  };
}
