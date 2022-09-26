import { Atom } from "./Atom.ts";
import { ExitResult, isEffectLike } from "./common.ts";
import { assert } from "./deps/std/testing/asserts.ts";
import { RunState } from "./Runtime.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { noop } from "./util.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  declare argEnterError?: ExitResult;
  declare enterResult?: unknown;
  declare argExitError?: ExitResult;
  declare exitResult?: ExitResult;

  enter = (state: RunState) => {
    // If initialized, return the previously-computed result
    if ("enterResult" in this) {
      return this.enterResult;
    }

    // A container, into which we map the resolved args
    const args: unknown[] = [];

    // Effect-like args must be resolved. Their resolution may
    // return or yield errors, which need to be propagated upward
    // through parent effects.
    for (const arg of this.source.args) {
      if (isEffectLike(arg)) {
        const argWork = this.context.get(arg.id)!;
        assert(argWork instanceof AtomWork);
        if (argWork.argEnterError) {
          this.argEnterError = argWork.argEnterError;
          break;
        } else {
          const argEnterResult = argWork.enter(state);
          if (argEnterResult instanceof Error) {
            this.argEnterError = argEnterResult;
            break;
          } else {
            args.push(argEnterResult);
          }
        }
      } else {
        args.push(arg);
      }
    }

    // A dependency failed to resolve, halt execution.
    if (this.argEnterError) {
      return;
    }

    // Ensure `run`-supplied logic is bound to the supplied env
    const enter = this.source.enter.bind(this.context.env);

    try {
      // Enter with the resolved `args`
      const enterResult = enter(...args);
      this.enterResult = enterResult;
    } catch (thrown) {
      // Wrap the thrown value with an `UnexpectedThrow`
      this.enterResult = new UnexpectedThrow(thrown, this);
    }

    this.context.props?.hooks?.forEach(({ enter }) => {
      enter?.(this.source, this.enterResult);
    });

    // Iterate over the atom's dependencies (all of which are no longer
    // needed by this atom, as we've executed `enter`)
    if (this.source.dependencies?.size) {
      for (const { id } of this.source.dependencies) {
        // Get the optional set of dependents for the given dependency
        const dependents = state.dependents.get(id);
        dependents?.delete(this.source.id);
        // Remove this atom from the set of dependents
        // Assuming there are now no dependents and the exit is defined...
        if (!dependents?.size) {
          // Get the dependency's work
          const dependency = this.context.get(id)!;
          assert(dependency instanceof AtomWork);
          // Run its exit and capture the optional exit error
          const dependencyExit = dependency.exit(state);
          dependency.exitResult = dependencyExit;
          if (dependencyExit instanceof Error) {
            return dependencyExit;
          }
        }
      }
    }

    // If we're at the effect root, we immediately exit,
    // as no other effects are reliant on the enter result.
    if (!state.dependents.get(this.source.id)) {
      const exitResult = this.exit(state);
      this.exitResult = exitResult;
      if (exitResult instanceof Error) {
        return exitResult;
      }
    }

    return this.enterResult;
  };

  exit = (_state: RunState) => {
    if (!("exitResult" in this)) {
      if (this.source.exit === noop) {
        this.exitResult = undefined;
      } else {
        const exit = this.source.exit.bind(this.context.env);
        try {
          const exitResult = exit(this.enterResult);
          this.exitResult = exitResult;
        } catch (e) {
          this.exitResult = new UnexpectedThrow(e, this);
        }
        this.context.props?.hooks?.forEach(({ exit }) => {
          exit?.(this.source, this.exitResult);
        });
      }
    }
    return this.exitResult;
  };
}
