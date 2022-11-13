import { E, Effect, T } from "../Effect.ts"
import { collect } from "../util/mod.ts"

export function ls<Elements extends unknown[]>(
  ...elements: Elements
): Effect<LsT<Elements>, E<Elements[number]>> {
  return Effect.from("Ls", (env) => {
    const elementRuns = elements.map((element) =>
      Effect.lift(element).impl(env)
    )
    return () => {
      return collect(elementRuns.map((elementRun) => elementRun()))
    }
  }, ...elements)
}

export type LsT<Elements extends unknown[]> = {
  [K in keyof Elements]: T<Elements[K]>
}
