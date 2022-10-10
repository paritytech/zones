import {
  EnsureOneStream,
  LsStreamKeys,
  RecStreamKeys,
} from "./sole_stream_typing.ts";
import { stream } from "./Stream.ts";

const someStream = stream<unknown>()(0, () => ({
  open(_push) {
    return Promise.resolve();
  },
  close: () => {},
}));

declare function recSole<T>(x: EnsureOneStream<T, RecStreamKeys<T>>): void;
recSole({
  // @ts-expect-error: intentional
  a: someStream,
  // @ts-expect-error: intentional
  b: someStream,
  c: "HELLO",
});

declare function lsSole<T extends unknown[]>(
  ...x: EnsureOneStream<T, LsStreamKeys<T>>
): void;
// @ts-expect-error: intentional
lsSole(1, someStream, someStream);
