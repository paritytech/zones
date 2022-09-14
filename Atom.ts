import { AtomState } from "./AtomState.ts";
import { Collection$, CollectionT, E, S, V } from "./common.ts";
import { Effect, EffectId } from "./Effect.ts";
import { Context } from "./Runtime.ts";
import { sig } from "./Signature.ts";
import { noop, U2I } from "./util.ts";

export class Atom<
  A extends unknown[] = any[],
  EnterV = any,
  EnterR = any,
  ExitV = any,
  ExitR extends AtomExitR = AtomExitR,
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
    readonly exit: (this: ExitV, enterR: EnterR) => ExitR,
  ) {
    super();
    const argsId = args.length ? `a(${args.map(sig.unknown)})` : "";
    const enterId = `enter_${sig.ref(enter)}`;
    const exitId = `exit_${sig.ref(exit)}`;
    this.id = `at(${argsId},${enterId},${exitId})` as EffectId;
  }

  state = (context: Context): AtomState => {
    return new AtomState(context, this);
  };
}

export type AtomExitR = void | Error | Promise<void | Error>;

export function atom<
  A extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends AtomExitR = void,
>(
  args: [...A],
  enter: (this: EnterV, ...args: CollectionT<A>) => EnterR,
  exit: (this: ExitV, enterR: EnterR) => ExitR = noop as any,
): Atom<A, EnterV, EnterR, ExitV, ExitR> {
  return new Atom(args, enter, exit);
}

export function atomf<
  X extends unknown[],
  EnterV,
  EnterR,
  ExitV = unknown,
  ExitR extends AtomExitR = void,
>(
  enter: (this: EnterV, ...args: X) => EnterR,
  exit: (this: ExitV, enterR: EnterR) => ExitR = noop as any,
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
