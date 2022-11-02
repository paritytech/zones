import { Placeholder } from "./Placeholder.ts";
import { Process } from "./Process.ts";
import * as U from "./util/mod.ts";

declare const T_: unique symbol;
declare const E_: unique symbol;
declare const V_: unique symbol;

export class Effect<
  T = any,
  E extends Error = Error,
  V extends PropertyKey = PropertyKey,
> {
  declare [T_]: T;
  declare [E_]: E;
  declare [V_]: V;

  id;

  constructor(
    readonly kind: string,
    readonly run: EffectInitRun,
    readonly children?: unknown[],
  ) {
    this.id = `${this.kind}(${this.children?.map(U.id.of).join(",") || ""})`;
  }

  access = <K extends $<keyof T>>(
    key: K,
  ): Effect<T[U.AssertKeyof<T, K>], E, V> => {
    return new Effect("Access", (process) => {
      return U.memo(() => {
        return U.thenOk(
          U.all(process.resolve(this), process.resolve(key)),
          ([target, key]) => target[key],
        );
      });
    }, [this, key]);
  };

  as = <U extends T>() => {
    return this as unknown as Effect<U, E, V>;
  };

  excludeError = <C extends E>() => {
    return this as unknown as Effect<T, Exclude<E, C>, V>;
  };
}

export type EffectInitRun = (process: Process) => () => unknown;

export type T<U> = U extends Effect<infer T> ? T
  : U extends Placeholder<PropertyKey, infer T> ? T
  : Exclude<Awaited<U>, Error>;
export type E<U> = U extends Effect<any, infer E> ? E : never;
export type V<U> = U extends Effect<any, Error, infer V> ? V
  : U extends Placeholder ? U["key"]
  : never;

export type $<T> = T | Effect<T> | Placeholder<PropertyKey, T>;
