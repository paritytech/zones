import { ExitStatus } from "./common.ts";
import { AnyEffect } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { EffectState } from "./Runtime.ts";

export function trace(): Trace {
  return new Trace();
}
export class Trace extends Hooks {
  elements: TraceElement[] = [];

  enter = ({ source }: EffectState, result: unknown): void => {
    this.elements.push({
      kind: "enter",
      source,
      result,
    });
  };

  exit = ({ source }: EffectState, result: ExitStatus): void => {
    this.elements.push({
      kind: "exit",
      source,
      result,
    });
  };
}

export type TraceElement =
  | TraceElementBase<"enter", unknown>
  | TraceElementBase<"exit", ExitStatus>;
type TraceElementBase<Kind extends "enter" | "exit", Result> = {
  kind: Kind;
  source: AnyEffect;
  result: Result;
};

export const traceMockElements_ = Symbol();

export function traceMock(...traceElement: TraceMockElement[]): TraceMock {
  return new TraceMock(traceElement);
}
export class TraceMock {
  [traceMockElements_]: TraceMockElement[];

  constructor(elements: TraceMockElement[] = []) {
    this[traceMockElements_] = elements;
  }

  enter = (
    source: AnyEffect,
    result?: (result: unknown) => void,
  ): TraceMock => {
    return new TraceMock([...this[traceMockElements_], {
      kind: "enter",
      result,
      source,
    }]);
  };

  exit = (
    source: AnyEffect,
    result?: (result: ExitStatus) => void,
  ): TraceMock => {
    return new TraceMock([...this[traceMockElements_], {
      kind: "exit",
      result,
      source,
    }]);
  };

  branch = (
    ...branches: ((builder: Omit<TraceMock, "branch">) => TraceMock)[]
  ): TraceMock => {
    return new TraceMock([...this[traceMockElements_], {
      kind: "branching",
      branches: branches.map((branch) => branch(new TraceMock())),
    }]);
  };
}

export type TraceMockElement =
  | TraceElementBase<"enter", void | ((result: unknown) => void)>
  | TraceElementBase<"exit", void | ((result: ExitStatus) => void)>
  | {
    kind: "branching";
    branches: TraceMock[];
  };

export function assertTrace(
  _tracer: Trace,
  mock: TraceMock,
): void {
  const _mockElements = mock[traceMockElements_];
  // TODO
}
