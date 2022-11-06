export type U2I<T> = (T extends any ? (value: T) => any : never) extends
  (value: infer R) => any ? R : never;

export type AssertKeyof<T, K> = K extends keyof T ? K : never;
