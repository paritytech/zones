import { ExitResult } from "../common.ts";
import { E, Effect, EffectState, T as T_, V } from "../Effect.ts";
import { Process } from "../Run.ts";

export function stream<T>() {
  return <A, R extends ExitResult>(
    arg: A,
    streamControllerFactory: StreamControllerFactory<T, A, R>,
  ): Stream<T, A, R> => {
    return new Stream(arg, streamControllerFactory);
  };
}

export class Stream<T = any, A = any, R extends ExitResult = ExitResult>
  extends Effect<"Stream", V<A>, E<A> | Extract<Awaited<R>, Error>, T>
{
  constructor(
    readonly arg: A,
    readonly streamControllerFactory: StreamControllerFactory<T, A, R>,
  ) {
    super("Stream", [arg, streamControllerFactory]);
  }

  state = (process: Process): StreamState => {
    return new StreamState(process, this);
  };
}

export type StreamControllerFactory<T, A, OpenR extends ExitResult> = (
  resolved: T_<A>,
) => StreamController<T, OpenR>;
export interface StreamController<T, OpenR extends ExitResult> {
  open(push: (value: T) => void): OpenR;
  close: () => void;
}

export class StreamState extends EffectState<Stream> {}
