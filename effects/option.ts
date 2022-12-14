import { E, Effect, T } from "../Effect.ts";
import * as U from "../util/mod.ts";

/** Similar to the `next` method, but resolves to undefined if the target resolution is nullish */
export function option<Target, UseResult>(
  target: Target,
  cb: (resolved: NonNullable<T<Target>>) => UseResult,
): Effect<
  undefined | Exclude<UseResult, Error>,
  E<Target> | Extract<UseResult, Error>
> {
  return new Effect({
    kind: "Option",
    impl(env) {
      return () => {
        return U.thenOk(env.resolve(target), (targetResolved) => {
          return targetResolved === undefined || targetResolved === null
            ? undefined
            : cb(targetResolved as any);
        });
      };
    },
    items: [target, cb],
    memoize: true,
  });
}
