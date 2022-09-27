import { RuntimeContext } from "./Runtime.ts";
import { Signature } from "./Signature.ts";
import { Work } from "./Work.ts";

declare const S_: unique symbol;
declare const V_: unique symbol;
declare const E_: unique symbol;
declare const T_: unique symbol;

declare const effectId_: unique symbol;
export type EffectId = Signature & { [effectId_]: true };

export abstract class Effect<
  S extends boolean,
  V,
  E extends Error,
  T,
> {
  declare [S_]: S;
  declare [V_]: V;
  declare [E_]: E;
  declare [T_]: T;

  abstract id: EffectId;
  abstract work: (context: RuntimeContext) => Work;

  declare dependencies?: Set<AnyEffect>;
}

export type AnyEffect = Effect<boolean, any, Error, any>;
