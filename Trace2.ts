import { ExitStatus } from "./common.ts";
import { AnyEffect } from "./Effect.ts";
import { Hooks } from "./Hooks.ts";
import { Work } from "./Work.ts";

export function tracer(): Tracer {
  return new Tracer();
}
export class Tracer extends Hooks {
  elements: TraceElement[] = [];

  enter = (work: Work, result: unknown): void => {
    this.elements.push({
      kind: "enter",
      source: work.source,
      result,
    });
  };

  exit = (work: Work, result: ExitStatus): void => {
    this.elements.push({
      kind: "exit",
      source: work.source,
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

export function traceMock(...traceElement: TraceElement[]): TraceMock {
  return new TraceMock(traceElement);
}
export class TraceMock {
  [traceMockElements_]: TraceMockElement[];

  constructor(elements: TraceMockElement[] = []) {
    this[traceMockElements_] = elements;
  }

  enter = (source: AnyEffect, result?: unknown): TraceMock => {
    return new TraceMock([...this[traceMockElements_], {
      kind: "enter",
      result,
      source,
    }]);
  };

  exit = (source: AnyEffect, result?: ExitStatus): TraceMock => {
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

export type TraceMockElement = TraceElement | {
  kind: "branching";
  branches: TraceMock[];
};

export function assertTrace(
  tracer: Tracer,
  expectedMock: TraceMock,
): void {}

const x = traceMock();
const y = x[traceMockDigest]();
