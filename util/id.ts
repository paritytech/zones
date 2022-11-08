import { Effect } from "../Effect.ts";
import { Env, env } from "../Env.ts";
import * as U from "../util/mod.ts";

let i = 0;

export const keyIds: Record<PropertyKey, string> = {};
export function keyId(key: PropertyKey) {
  let keyId = keyIds[key];
  if (!keyId) {
    keyId = `Key(${i++})`;
    keyIds[key] = keyId;
  }
  return keyId;
}

export const refIds = new WeakMap<object, string>();
export function refId(ref: object): string {
  return U.getOrInit(refIds, ref, () => {
    return `Ref(${i++})`;
  });
}

export const unknownIds = new Map<unknown, string>();
export function unknownId(value: unknown) {
  return U.getOrInit(unknownIds, value, () => {
    return `Unknown(${i++})`;
  });
}

export function id(target: unknown, envRound?: number): string {
  switch (typeof target) {
    case "function": {
      if (target === env) {
        return `env(${envRound || ""})`;
      } else if (!target.name) {
        return refId(target as (...args: any[]) => any);
      }
      return `fn(${target.name})`;
    }
    case "object": {
      if (target instanceof Effect) {
        return target.id(envRound);
      } else if (target === null) {
        return "null";
      }
      return refId(target);
    }
    case "string":
    case "number":
    case "symbol": {
      return keyId(target);
    }
    default: {
      return unknownId(target);
    }
  }
}
