export {}

// import * as U from "../util/mod.ts"

// let i = 0

// const keyIds: Record<PropertyKey, string> = {}

// export function fromKey(src: PropertyKey) {
//   let keyId = keyIds[src]
//   if (!keyId) {
//     keyId = `Key(${i++})`
//     keyIds[src] = keyId
//   }
//   return keyId
// }

// export function fromBigInt(src: bigint): string {
//   const key = src.toString()
//   let bigIntId = keyIds[key]
//   if (!bigIntId) {
//     bigIntId = `BigInt(${i++})`
//     keyIds[key] = bigIntId
//   }
//   return bigIntId
// }

// const weakIds = new WeakMap<object, string>()

// export function fromFn(src: Function): string {
//   return U.getOrInit(weakIds, src, () => {
//     return `Fn(${src.name || i++})`
//   })
// }

// export function fromObject(src: object): string {
//   return U.getOrInit(weakIds, src, () => {
//     return `Object(${i++})`
//   })
// }

// export function fromUnknown(src: unknown): string {
//   switch (typeof src) {
//     case "function": {
//       return fromFn(src)
//     }
//     case "object": {
//       return src === null ? "null()" : fromObject(src)
//     }
//     case "bigint": {
//       return fromBigInt(src)
//     }
//     case "number":
//     case "string":
//     case "symbol": {
//       return fromKey(src)
//     }
//     case "boolean": {
//       return `${src}()`
//     }
//     case "undefined": {
//       return "undefined()"
//     }
//   }
// }
