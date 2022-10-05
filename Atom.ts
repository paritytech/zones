import { Collection$, CollectionT, E, ExitResult, S, V } from "./common.ts";
import { Effect, EffectId } from "./Effect.ts";
import { sig } from "./Signature.ts";
import { UnexpectedThrow } from "./UnexpectedThrow.ts";
import { U2I } from "./util.ts";

export function atom<
  A extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends ExitResult = void,
>(
  args: [...A],
  enter: (this: EnterV, ...args: CollectionT<A>) => EnterR,
  exit: (this: ExitV, enterR: Awaited<EnterR> | UnexpectedThrow) => ExitR =
    undefined!,
): Atom<A, EnterV, EnterR, ExitV, ExitR> {
  return new Atom(args, enter, exit);
}

// TODO(@tjjfvi): should we swap this out with the generic-fn-friendly factory?
export function atomf<
  X extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends ExitResult = void,
>(
  enter: (this: EnterV, ...args: X) => EnterR,
  exit: (this: ExitV, enterR: Awaited<EnterR> | UnexpectedThrow) => ExitR =
    undefined!,
) {
  return <A extends Collection$<X>>(
    ...args: A
  ): Atom<A, EnterV, EnterR, ExitV, ExitR> => {
    return new Atom(
      args as [...A],
      enter as (this: EnterV, ...args: CollectionT<A>) => EnterR,
      exit,
    );
  };
}

export class Atom<
  A extends unknown[] = any[],
  EnterV = any,
  EnterR = any,
  ExitV = any,
  ExitR extends ExitResult = ExitResult,
> extends Effect<
  S<A[number]> | (Promise<never> extends (EnterR | ExitR) ? false : true),
  U2I<V<A[number]>> & EnterV & ExitV,
  E<A[number]> | Extract<Awaited<EnterR | ExitR>, Error>,
  Exclude<Awaited<EnterR>, Error>
> {
  id;

  /**
   * Container for discrete units of computation
   * @param args effects, the `T` of which are to be supplied to `enter`
   * @param enter a fn that returns either an `Error` subtype or another value (inferred as `T`)
   * @param exit a fn to be executed when the atom is no longer depended upon by parent `enter`s
   */
  constructor(
    readonly args: [...A],
    readonly enter: (this: EnterV, ...args: CollectionT<A>) => EnterR,
    readonly exit: (
      this: ExitV,
      enterR: Awaited<EnterR> | UnexpectedThrow,
    ) => ExitR,
  ) {
    super();
    let id = "atom("; // TODO: improved legibility?
    id += `args(${args.map(sig.unknown).join("\n")})`;
    id += `enter_${sig.ref(this.enter)}`;
    if (this.exit) {
      id += `,exit_${sig.ref(this.exit)}`;
    }
    this.id = id + ")" as EffectId;
  }
}
