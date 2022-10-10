import { U2I } from "../util.ts";
import { Stream } from "./Stream.ts";

declare const multipleStreamsError_: unique symbol;
/** Appears as constraint in place of supplied `Stream` if there is more than one `Stream` in the dependency collection */
type MultipleStreamsError<
  T = "There is more than one `Stream` in the dependency collection",
> = T & { [_ in typeof multipleStreamsError_]: true };

export type EnsureOneStream<T, StreamKeys extends PropertyKey> =
  [U2I<StreamKeys>] extends [never]
    ? { [K in keyof T]: K extends StreamKeys ? MultipleStreamsError : T[K] }
    : T;

export type RecStreamKeys<T> = keyof {
  [K in keyof T as T[K] extends Stream ? K : never]: true;
};

export type LsStreamKeys<T extends unknown[]> = keyof {
  [
    K in keyof T as K extends `${number}` ? T[K] extends Stream ? K : never
      : never
  ]: true;
};
