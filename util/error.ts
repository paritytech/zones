export function throwIfError<T>(value: T): Exclude<T, Error> {
  if (value instanceof Error) {
    throw value;
  }
  return value as Exclude<T, Error>;
}

export type ExitResolved = void | Error;
export type ExitResult = ExitResolved | Promise<ExitResolved>;
