import * as U from "../util.ts";

export type VisitTrackerEventKind = "enter" | "exit";
export type VisitTrackerHandle = Record<
  VisitTrackerEventKind,
  (result?: unknown) => void
>;
export class VisitTrackerEvent {
  declare result?: unknown;
  constructor(
    readonly kind: VisitTrackerEventKind,
    readonly i: number,
    result?: unknown,
  ) {
    this.result = result;
  }

  static sequence = <
    Args extends ConstructorParameters<typeof VisitTrackerEvent>[],
  >(
    ...args: Args
  ): { [K in keyof Args]: VisitTrackerEvent } => {
    return args.map((args) => new VisitTrackerEvent(...args)) as any;
  };
}

export class VisitTracker {
  sequence: VisitTrackerEvent[] = [];

  handles = <N extends number>(
    n: N,
  ): U.ArrayOfLength<VisitTrackerHandle, N> => {
    const handles: VisitTrackerHandle[] = [];
    for (let i = 0; i < n; i++) {
      const emitter = (kind: VisitTrackerEventKind) => {
        return (result?: unknown) => {
          this.sequence.push(new VisitTrackerEvent(kind, i, result));
          return result;
        };
      };
      handles.push({
        enter: emitter("enter"),
        exit: emitter("exit"),
      });
    }
    return handles as any;
  };
}
