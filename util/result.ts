export type ExtractT<V> = Exclude<V, Error>
export type ExtractE<V> = Extract<V, Error>

export type Result<T> = T | Promise<T>

export type ResultT<R> = ExtractT<Awaited<R>>
export type ResultE<R> = ExtractE<Awaited<R>>

export function map<From, To>(
  value: Result<From>,
  cb: (value: From) => To,
): Result<To> {
  return value instanceof Promise ? value.then(cb) : cb(value)
}

export function mapOk<From, To>(
  value: Result<From>,
  cb: (value: ExtractT<From>) => To,
): Result<ExtractE<From> | To> {
  return map(value, (value) => {
    return value instanceof Error ? value : cb(value as ExtractT<From>) as any
  })
}

export function collect<T>(
  ...elements: Result<T>[]
): Result<ExtractT<T>[] | ExtractE<T>> {
  const pending: Promise<void>[] = []
  const ok = new Array(elements.length)
  let error: undefined | ExtractE<T>
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!
    if (element instanceof Promise) {
      pending.push(element.then((rElement) => {
        placement(rElement, i)
      }))
    } else {
      placement(element, i)
    }
  }
  return pending.length ? Promise.all(pending).then(result) : result()

  function placement(element: T, i: number) {
    if (element instanceof Error) {
      error = element as ExtractE<T>
    } else {
      ok[i] = element
    }
  }
  function result() {
    return error || ok
  }
}
