import { effect } from "../Effect.ts";

export const round = effect<number, never>({
  kind: "Round",
  init(env) {
    return () => {
      return env.round;
    };
  },
});
