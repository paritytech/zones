import { Signature } from "./Signature.ts";

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
}

export type AnyEffect = Effect<boolean, any, Error, any>;
