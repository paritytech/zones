export class RuneError<Name extends string> extends Error {
  constructor(
    override readonly name: Name,
    message: string,
  ) {
    super(message);
  }
}

export type ExitStatus = void | Error;
export type ExitResult = ExitStatus | Promise<ExitStatus>;
