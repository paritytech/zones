import { E, Effect, T } from "../Effect.ts";
import { lift } from "./lift.ts";

/** Similar to the `next` method, but resolves to undefined if the target resolution is nullish */
export function option<Target, UseResult>(
  target: OptionTarget<Target>,
  use: (resolved: NonNullable<T<Target>>) => UseResult,
): Effect<
  undefined | Exclude<UseResult, Error>,
  E<Target> | Extract<UseResult, Error>
> {
  return lift(target).next((resolved) => {
    return resolved ? use(resolved) : undefined;
  });
}

/**
 * A type to constrain the `option` target such that one **can never supply
 * solely-nullish values/effects**
 */
export type OptionTarget<T> = [T] extends
  [undefined | null | Effect<undefined | null>] ? never : T;
