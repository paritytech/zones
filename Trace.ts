import { ExitResult } from "./common.ts";
import { assert } from "./deps/std/testing/asserts.ts";
import { AnyEffect } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";

type TraceEvent =
  & { source: AnyEffect }
  & ({
    kind: "enter";
    enterResult?: unknown;
  } | {
    kind: "exit";
    exitResult?: ExitResult;
  });

export interface Trace extends Required<Hooks<Trace>> {
  sequence: TraceEvent[];
  clear(): void;
}
export function trace(...events: TraceEvent[]): Trace {
  let sequence = [...events];
  const setSequence = (s: TraceEvent[]) => {
    sequence = s;
    t.sequence = s;
  };
  const t: Trace = {
    sequence,
    enter: (source, enterResult) => {
      sequence.push({
        kind: "enter",
        source,
        enterResult,
      });
      return t;
    },
    exit: (source, exitResult) => {
      sequence.push({
        kind: "exit",
        source,
        exitResult,
      });
      return t;
    },
    clear: () => {
      setSequence([]);
    },
  };
  return t;
}

export function assertTrace(
  actual: Trace,
  expected: Trace,
) {
  assert(actual.sequence.length === expected.sequence.length);
  actual.sequence.forEach((actualEvent, i) => {
    const expectedEvent = expected.sequence[i]!;
    assert(actualEvent.source === expectedEvent.source);
    switch (actualEvent.kind) {
      case "enter": {
        assert(expectedEvent.kind === "enter");
        assert(actualEvent.enterResult === expectedEvent.enterResult);
        break;
      }
      case "exit": {
        assert(expectedEvent.kind === "exit");
        assert(actualEvent.exitResult === expectedEvent.exitResult);
        break;
      }
    }
  });
}
