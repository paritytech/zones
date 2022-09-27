import { Atom } from "./Atom.ts";
import { isEffectLike, MaybeRejection } from "./common.ts";
import { Hooks } from "./Hooks.ts";
import { RunState } from "./Runtime.ts";
import { assertKnownWork } from "./test_util.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { noop } from "./util.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  #argI = 0;
  #args: unknown[] = [];

  captured = false; // can be set to `true` by a try/catch

  declare argEnterError?: MaybeRejection;
  declare argExitError?: MaybeRejection;
  declare exitResult?: MaybeRejection;

  declare enterResult?: unknown;

  rejection = () => {
    return this.argEnterError || this.argExitError || this.exitResult;
  };

  resolution = () => {
    return this.rejection() || this.enterResult;
  };

  enter = (state: RunState) => {
    if ("enterResult" in this) {
      return;
    }

    // Effect-like args must be resolved. Their resolution may return or yield
    // errors, which need to be propagated upward through parent effects.
    while (this.#argI < this.source.args.length) {
      const arg = this.source.args[this.#argI]!;
      if (isEffectLike(arg)) {
        const work = this.context.get(arg.id)!;
        assertKnownWork(work);
        if (work.argEnterError) {
          this.argEnterError = work.argEnterError;
          break;
        } else {
          work.enter(state);
          if (work.enterResult instanceof Error) {
            this.argEnterError = work.enterResult;
            break;
          } else {
            this.#args.push(work.enterResult);
          }
        }
      } else {
        this.#args.push(arg);
      }
      this.#argI++;
    }

    if (this.argEnterError && !this.captured) {
      this.argExits(state, true);
    }

    // Only proceed if `#args` call did not set an `argEnterError`.
    if (!this.argEnterError) {
      // Ensure `run`-supplied logic is bound to the supplied env
      const enter = this.source.enter.bind(this.context.env);

      try {
        // Enter with the resolved `args`
        const enterResult = enter(...this.#args);
        this.enterResult = enterResult;
      } catch (thrown) {
        // Wrap the thrown value with an `UnexpectedThrow`
        this.enterResult = new UnexpectedThrow(thrown, this);
      }

      this.#hook("enter");

      this.argExits(state);
    }

    // If we're at the effect root, we immediately exit,
    // as no other effects are reliant on the enter result.
    if (!state.dependents.get(this.source.id)) {
      this.exit();
    }

    return;
  };

  argExits = (
    state: RunState,
    early?: boolean,
  ) => {
    for (let argI = this.#argI; argI > 0; argI--) {
      const arg = this.source.args[argI]!;
      if (isEffectLike(arg)) {
        const dependents = state.dependents.get(arg.id);
        dependents?.delete(this.source.id);
        const work = this.context.get(arg.id)!;
        assertKnownWork(work);
      }
    }
    // Iterate over the atom's dependencies (all of which are no longer
    // needed by this atom, as we've executed `enter`)
    if (this.source.dependencies?.size) {
      for (const { id } of this.source.dependencies) {
        // Get the set of dependents for the given dependency
        const dependents = state.dependents.get(id);
        // Remove this atom from the set of dependents
        dependents?.delete(this.source.id);
        // Assuming there are now no dependents...
        if (!dependents?.size) {
          // Get the dependency's work
          const dependency = this.context.get(id)!;
          assertKnownWork(dependency);
          // Run its exit
          dependency.exit();
          // Propagate the exit error if defined
          if (!this.argExitError && dependency.exitResult instanceof Error) {
            this.argExitError = dependency.exitResult;
          }
        }
      }
    }
  };

  exit = () => {
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
        this.#hook("exit");
      }
    }
  };

  #hook = (which: keyof Hooks) => {
    this.context.props?.hooks?.forEach((hooks) => {
      hooks[which]?.(
        this.source,
        which === "enter" ? this.enterResult : this.exitResult as any,
      );
    });
  };
}
