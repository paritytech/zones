import { Atom } from "./Atom.ts";
import { isEffectLike } from "./common.ts";
import { unimplemented } from "./deps/std/testing/asserts.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { Work } from "./Work.ts";

export class AtomWork extends Work<Atom> {
  declare value?: unknown;

  result = () => {
    if (!("value" in this)) {
      this.value = this.#result();
    }
    return this.value;
  };

  #result = async () => {
    // 1. resolve args
    const args = await this.#enterArgs();
    // 2. execute enter
    const result = await this.#enter(args);
    // 3. execute dependency exits if no more dependents
    await this.#exitArgs();
    // 4. execute current exit if root
    !this.context.dependents(this.source.id)
      && await this.#exit(result);
    // 5. return the result
    return result;
  };

  #enterArgs = async (): Promise<unknown[]> => {
    const resolved = new Array<unknown>(this.source.args.length);
    const pending: Promise<unknown>[] = [];
    for (let i = 0; i < this.source.args.length; i++) {
      const arg = this.source.args[i]!;
      if (isEffectLike(arg)) {
        const argEnterResult = this.context.result(arg.id);
        if (argEnterResult instanceof Promise) {
          pending.push(argEnterResult.then((result) => {
            resolved[i] = result;
          }));
        } else {
          resolved[i] = argEnterResult;
        }
      } else {
        resolved[i] = arg;
      }
    }
    await Promise.all(pending);
    return resolved;
  };

  #enter = async (args: unknown[]): Promise<unknown> => {
    const result = await this.#run(() => {
      return this.source.enter.bind(this.context.env)(...args);
    });
    this.source.dependencies?.forEach(({ id }) => {
      this.context.dependents(id)?.delete(this.source.id);
    });
    return result;
  };

  #exitArgs = async () => {
    if (this.source.dependencies) {
      const pending: Promise<unknown>[] = [];
      for (const { id } of this.source.dependencies) {
        const dependencyDependents = this.context.dependents(id);
        if (dependencyDependents?.size === 0) {
          const work = this.context.work(id);
          if (work instanceof AtomWork) {
            pending.push(work.#exit());
          } else {
            unimplemented();
          }
        }
      }
      await Promise.all(pending);
    }
  };

  #exit = async (result?: unknown) => {
    if (this.source.exit) {
      await this.#run(async () => {
        return this.source.exit.bind(this.context.env)(
          result || await this.value,
        );
      });
    }
  };

  #run = async (fn: () => unknown) => {
    let result: unknown;
    try {
      result = await fn();
    } catch (e) {
      result = new UnexpectedThrow(e, this);
    }
    if (result instanceof Error) {
      this.context.reject(result);
    }
    return result;
  };
}
