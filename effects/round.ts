import { effect } from "../Effect.ts";

/** Resolves to the current round of the execution env */
export const round = effect<number, never>({
  kind: "Round",
  init(env) {
    return () => {
      return env.round;
    };
  },
});