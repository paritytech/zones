import { ExitResult, then } from "./common.ts";
import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Run.ts";
import * as sig from "./Signature.ts";
import { identity } from "./util.ts";

declare const V_: unique symbol;
declare const E_: unique symbol;
declare const T_: unique symbol;

declare const effectId: unique symbol;
export type EffectId = sig.Signature & { [effectId]?: true };

export abstract class Effect<
  K extends string = string,
  V extends Placeholder = Placeholder,
  E extends Error = Error,
  T = any,
> {
  declare [V_]: V;
  declare [E_]: E;
  declare [T_]: T;

  declare id: EffectId;
  declare dependencies?: Set<EffectLike>;

  constructor(
    readonly kind: K,
    readonly args?: unknown[],
  ) {
    args?.forEach((arg) => {
      if (isEffectLike(arg)) {
        if ("dependencies" in this) {
          this.dependencies!.add(arg);
        } else {
          this.dependencies = new Set([arg]);
        }
      }
    });
    this.id = `${this.kind}(${this.args?.map(sig.of).join(",") || ""})`;
  }

  abstract state: (process: Process) => EffectState;
}

export abstract class EffectState<Source extends Effect = Effect> {
  declare result?: unknown;
  declare isRoot?: true;

  #dependents = new Set<EffectState>();
  #orphanedCbs = new Set<() => ExitResult>();

  constructor(
    readonly process: Process,
    readonly source: Source,
  ) {}

  addDependent = (dependent: EffectState): void => {
    this.#dependents.add(dependent);
  };

  onOrphaned = (cb: () => ExitResult) => {
    this.#orphanedCbs.add(cb);
  };

  removeDependent = (dependent: EffectState): ExitResult => {
    this.#dependents.delete(dependent);
    return this.runOrphanedCbs();
  };

  runOrphanedCbs = (): ExitResult => {
    if (!this.#dependents.size) {
      let err: undefined | { instance: Error; i: number };
      const pendingExits: Promise<unknown>[] = [];
      const orphanedCbs = [...this.#orphanedCbs.values()];
      for (let i = 0; i < orphanedCbs.length; i++) {
        const pending = then(
          orphanedCbs[i]!(),
          identity,
          (instance) => {
            if (!err || i < err.i) {
              err = { i, instance };
            }
          },
        );
        if (pending instanceof Promise) {
          pendingExits.push(pending);
        }
      }
      return err?.instance;
    }
  };

  abstract getResult: () => unknown;
}

export abstract class Name<Root extends EffectLike = EffectLike> {
  abstract root: Root;

  get id(): EffectId {
    return this.root.id;
  }
}

export type EffectLike<
  V extends Placeholder = Placeholder,
  E extends Error = Error,
  T = any,
> = Effect<string, V, E, T> | Name<EffectLike<V, E, T>>;

export function isEffectLike(inQuestion: unknown): inQuestion is EffectLike {
  return inQuestion instanceof Effect || inQuestion instanceof Name;
}

export type V<U> = U extends EffectLike<infer V> ? V
  : U extends Placeholder ? U
  : never;
export type E<U> = U extends EffectLike<Placeholder, infer E> ? E : never;
// TODO: fully ensure no promises-wrappers/errors
export type T<U> = U extends EffectLike<Placeholder, Error, infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : Exclude<Awaited<U>, Error>;

export type $<T> =
  | T
  | EffectLike<Placeholder, Error, T>
  | Placeholder<PropertyKey, T>;
