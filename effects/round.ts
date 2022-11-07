import { Effect } from "../Effect.ts";

/** Resolves to the current round of the execution env */
export const round = new Effect<number, never>({
  kind: "Round",
  init(env) {
    return () => {
      return env.round as any;
    };
  },
});
