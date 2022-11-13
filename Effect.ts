import { Env } from "./Env.ts"
import { ls, LsT } from "./std/Ls.ts"
import { isNone, map, mapOk, Nullish } from "./util/mod.ts"
import { AssertKeyof, collect, ResultE, ResultT } from "./util/mod.ts"

export interface EffectProps<T, E extends Error> {
  readonly [Effect_]?: EffectPhantoms<T, E>

  readonly kind: string
  readonly items?: unknown[]
  readonly impl: EffectImpl
}

export class Effect<T = any, E extends Error = Error>
  implements EffectProps<T, E>
{
  declare readonly [Effect_]?: EffectPhantoms<T, E>

  readonly kind
  readonly impl
  readonly items
  readonly id

  constructor({ kind, items, impl }: EffectProps<T, E>) {
    this.kind = kind
    this.impl = impl
    this.items = items
    this.id = "TODO"
  }

  bind: EffectBind<T, E> = (env) => {
    return () => this.impl(env)()
  }

  ok(this: HasOk<T, this>): Effect<T, never> {
    return this.#map("AssertOk", (thisResult) => {
      if (thisResult instanceof Error) {
        throw thisResult
      }
      return thisResult
    }) as any
  }

  mapOk<R>(
    this: HasOk<T, this>,
    cb: (value: T) => R,
  ): Effect<ResultT<R>, E | ResultE<R>> {
    return this.#map("MapOk", (thisResult) => {
      return thisResult instanceof Error ? thisResult : cb(thisResult) as any
    })
  }

  mapError<R>(
    this: HasError<E, this>,
    cb: (value: E) => R,
  ): Effect<T | ResultT<R>, ResultE<R>> {
    return this.#map("MapError", (thisResult) => {
      return thisResult instanceof Error ? cb(thisResult) : thisResult as any
    })
  }

  mapSome<R>(
    this: HasSome<T, this>,
    cb: (value: NonNullable<T>) => R,
  ): Effect<NonNullable<T> | R, E> {
    return this.#map("MapSome", (thisResult) => {
      return isNone(thisResult)
        ? thisResult as any
        : cb(thisResult as NonNullable<T>)
    })
  }

  mapNone<R>(
    this: HasNone<T, this>,
    cb: () => R,
  ): Effect<T | ResultT<R>, E | ResultE<R>> {
    return this.#map("MapNone", (thisResult) => {
      return isNone(thisResult) ? cb() as any : thisResult
    })
  }

  #map<R>(
    kind: string,
    cb: (thisResult: T | E) => R,
  ): Effect<ResultT<R>, ResultE<R>> {
    return Effect.from(kind, (env) => {
      const runThis = this.impl(env)
      return () => map(runThis(), cb)
    }, [this])
  }

  access<K extends Item<keyof T>>(key: K): Effect<T[AssertKeyof<T, T_<K>>], E> {
    return Effect.from("Access", (env) => {
      const runThis = this.impl(env)
      const runKey = Effect.lift(key).impl(env)
      return () =>
        mapOk(collect(runThis(), runKey()), ([rThis, rKey]) => rThis[rKey])
    }, [this])
  }

  rc<Keys extends [unknown, ...unknown[]]>(...keys: Keys): Effect<
    [count: number, target: T, ...keys: LsT<Keys>],
    E | E_<Keys[number]>
  > {
    return Effect.from("Rc", (env) => {
      const runSelf = this.impl(env)
      const runKeys = ls(...keys).impl(env)
      const counter = env.state(this.id, RcCounter)
      counter.i++
      return () => {
        return mapOk(collect(runSelf(), ...runKeys()), (rCollected) => {
          return [counter.i--, ...rCollected]
        })
      }
    })
  }

  static from<T, E extends Error>(
    kind: string,
    impl: EffectImpl,
    ...items: unknown[]
  ): Effect<T, E> {
    return new this({ kind, impl, items })
  }

  static lift<I>(item: I): Effect<T_<I>, E_<I>> {
    return (item instanceof Effect
      ? item
      : this.from("Lift", () => () => item)) as Effect<T_<I>, E_<I>>
  }
}

declare const Effect_: unique symbol
interface EffectPhantoms<T, E extends Error> {
  [T_]: T
  [E_]: E
}
declare const T_: unique symbol
declare const E_: unique symbol

export type EffectImpl = (this: Effect, env: Env) => () => any

export type EffectBind<T, E extends Error> = (env: Env) => EffectRun<T, E>
export type EffectRun<T, E extends Error> = () => Promise<T | E>

/**
 * TODO: do we want to produce an error message with some TS hackery? Downside, referencing `this`
 * within methods will require `as`-ifying (overcoming fake unions with `ContextError`).
 *
 * ```ts
 * declare const ContextError_: unique symbol
 * declare class ContextError<Message extends string> {
 *   [ContextError_]: Message
 * }
 * type ContextErrorMessage<Target extends string> =
 *   `Cannot map the "${Target}" of an effect whose type lacks a corresponding "${Target}" signature`
 * ```
 *
 * ```ts
 * ContextError<ContextErrorMessage<"ok">>
 * ```
 */

type HasOk<T, This> = [T] extends [never] ? never : This
type HasError<E, This> = [E] extends [never] ? never : This
type HasSome<T, This> = [NonNullable<T>] extends [never] ? never : This
type HasNone<T, This> = [Extract<T, Nullish>] extends [never] ? never : This
type HasLs<T, This> = [Extract<T, any[]>] extends [never] ? never : This

export type T<I> = I extends Effect<infer T> ? T
  : I extends typeof Env ? Env
  : ResultT<I>
export type E<I> = I extends Effect<any, infer E> ? E : ResultE<I>

type T_<I> = T<I>
type E_<I> = E<I>

export type Item<T> = T | Effect<T>

// @dprint-ignore-next-line
class RcCounter { i = 0 }
