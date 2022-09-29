import { ExitStatus } from "./common.ts";
import { assert } from "./deps/std/testing/asserts.ts";
import { AnyEffect } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";

export type TraceEventDesc<
  EnterResult,
  ExitResult_,
> = TraceEnterEventDec<EnterResult> | TraceExitEventDesc<ExitResult_>;

export type TraceEventHookDesc = TraceEventDesc<unknown, ExitStatus>;

export interface Trace extends Hooks {
  digest: () => TraceEventHookDesc[];
}

export function trace(...events: TraceEventHookDesc[]): Trace {
  let sequence = [...events];
  return {
    digest: () => {
      const s = sequence;
      sequence = [];
      return s;
    },
    enter: (work, result) => {
      sequence.push(new TraceEnterEventDec(work.source, result));
    },
    exit: (work, result) => {
      sequence.push(new TraceExitEventDesc(work.source, result));
    },
  };
}

export function traceDesc(...initial: TraceAssertions[]) {
  return new TraceDescBuilder(initial);
}

export type TraceAssertions = TraceEventDesc<
  (useResult?: unknown) => void,
  (useResult?: ExitStatus) => void
>;

export class TraceDescBuilder {
  constructor(readonly assertions: TraceAssertions[]) {}

  digest = (): TraceAssertions[] => {
    return [...this.assertions];
  };

  enter = (
    source: AnyEffect,
    useResult?: (result?: unknown) => void,
  ) => {
    return new TraceDescBuilder([
      ...this.assertions,
      new TraceEnterEventDec(source, useResult),
    ]);
  };

  exit = (
    source: AnyEffect,
    useResult?: (result?: ExitStatus) => void,
  ) => {
    return new TraceDescBuilder([
      ...this.assertions,
      new TraceExitEventDesc(source, useResult),
    ]);
  };
}

export class TraceEnterEventDec<Result> {
  readonly kind = "enter";
  constructor(
    readonly source: AnyEffect,
    readonly result?: Result,
  ) {}
}

export class TraceExitEventDesc<Result> {
  readonly kind = "exit";
  constructor(
    readonly source: AnyEffect,
    readonly result?: Result,
  ) {}
}

export function assertTrace(
  trace: Trace,
  traceAssertionBuilder: TraceDescBuilder,
) {
  const digest = trace.digest();
  assert(digest.length === traceAssertionBuilder.assertions.length);
  digest.forEach((desc, i) => {
    const expected = traceAssertionBuilder.assertions[i];
    assert(expected);
    assert(desc.kind === expected.kind);
    assert(desc.source === expected.source);
    expected.result?.(desc.result as any);
  });
}
