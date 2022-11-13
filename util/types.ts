export type Nullish = null | undefined

export type AssertKeyof<T, K> = K extends keyof T ? K : never
