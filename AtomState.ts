import { Atom } from "./Atom.ts";
import { isEffectLike } from "./common.ts";
import { Deferred, deferred } from "./deps/std/async.ts";
import { EffectState } from "./EffectState.ts";
import { noop } from "./util.ts";

export class AtomState extends EffectState<Atom> {
  result: unknown;

  run = () => {
    if (!this.result) {
      let someArgsPending = false;
      const args: unknown[] = [];
      let errorPending: undefined | Deferred<Error>;
      for (let argI = 0; argI < this.source.args.length; argI += 1) {
        const arg = this.source.args[argI]!;
        if (isEffectLike(arg)) {
          let argRunResult = this.context.getState(arg).run();
          if (argRunResult instanceof Error) {
            this.result = argRunResult;
            return argRunResult;
          } else if (argRunResult instanceof Promise) {
            someArgsPending = true;
            if (!errorPending) {
              errorPending = deferred<Error>();
            }
            argRunResult = argRunResult.then((result) => {
              if (result instanceof Error) {
                errorPending!.resolve(result);
              }
              return result;
            });
          }
          args.push(argRunResult);
        } else {
          args.push(arg);
        }
      }
      if (someArgsPending) {
        this.result = Promise.race([
          errorPending,
          Promise.all(args).then(this.enter),
        ]);
      } else {
        this.result = this.enter(args);
      }
    }
    return this.result;
  };

  enter = (args: unknown[]): unknown => {
    const enterResult = this.source.enter.bind(this.context.env)(...args);
    this.dependencies?.forEach((dependencyId) => {
      this.context.states.get(dependencyId)!.dependents?.delete(this.source.id);
    });
    return enterResult;
  };
}
