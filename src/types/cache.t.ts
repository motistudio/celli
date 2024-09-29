export type Key = string | number | symbol

export type BaseCache<K extends Key, T> = {
  get (key: K): T | undefined
  set (key: K, value: T): void
  has (key: K): boolean
  delete (key: K): void
  keys (): IterableIterator<K>
  values (): IterableIterator<T>
  entries (): IterableIterator<[K, T]>
  [Symbol.iterator] (): IterableIterator<[K, T]>
}

export interface Cache<K extends Key, T> {
  get (key: K): T | undefined
  set (key: K, value: T): void
  has (key: K): boolean
  delete (key: K): void
  keys (): IterableIterator<K>
  values (): IterableIterator<T>
  entries (): IterableIterator<[K, T]>
  clean (): void,
  [Symbol.iterator] (): IterableIterator<[K, T]>
}

export interface AsyncCache<K extends Key, T> {
  get (key: K): Promise<T | undefined>
  set (key: K, value: T): Promise<void>
  has (key: K): Promise<boolean>
  delete (key: K): Promise<void>
  keys (): AsyncIterableIterator<K>
  values (): AsyncIterableIterator<T>
  entries (): AsyncIterableIterator<[K, T]>
  clean (): Promise<void>
  [Symbol.asyncIterator] (): AsyncIterableIterator<[K, T]>
}

export type AbstractCache<K extends Key, T> = {
  [P in Exclude<keyof Cache<K, T>, typeof Symbol.asyncIterator | SymbolConstructor['asyncIterator'] | SymbolConstructor['iterator']>]: (...args: Parameters<Cache<K, T>[P]>) => ReturnType<Cache<K, T>[P]> | (P extends keyof AsyncCache<K, T> ? ReturnType<AsyncCache<K, T>[P]> : never)
}

export type ACache<K extends Key, T> = Cache<K, T> & AsyncCache<K, T>

export interface WrappedCache<C extends (Cache<Key, any> | AsyncCache<Key, any>)> {
  get (key: CacheKey<C>): ReturnType<C['get']>
  set (key: CacheKey<C>, value: CacheValue<C>): ReturnType<C['set']>
  has (key: CacheKey<C>): ReturnType<C['has']>
  delete (key: CacheKey<C>): ReturnType<C['delete']>
  keys (): ReturnType<C['keys']>
  values (): ReturnType<C['values']>
  entries (): ReturnType<C['entries']>
  clean (): ReturnType<C['clean']>
}

export type AnyCache<K extends Key, T> = BaseCache<K, T> | Cache<K, T> | AsyncCache<K, T> | AbstractCache<K, T>
export type AnyCacheType<K extends Key, T> = Cache<K, T> | AsyncCache<K, T> | AbstractCache<K, T>

export type CacheKey<C extends AnyCache<Key, any>> = (
  C extends AnyCache<infer K, any> ? K : never
)
// export type CacheKey<C extends AbstractCache<any, any> | AsyncCache<Key, any> | Cache<Key, any>> = (
//   C extends AsyncCache<infer K, any> ? (
//     K
//   ) : (
//     C extends Cache<infer K, any> ? K : (
//       C extends AbstractCache<infer K, any> ? K : never
//     )
//   )
// )

export type CacheValue<C extends AnyCache<Key, any>> = (
  C extends AnyCache<any, infer T> ? T : never
)
// export type CacheValue<C extends AbstractCache<any, any> | AsyncCache<Key, any> | Cache<Key, any>> = (
//   C extends AsyncCache<any, infer T> ? T : (
//     C extends Cache<any, infer T> ? T : (
//       C extends AbstractCache<any, infer T> ? T : never
//     )
//   )
// )

export type InnerCache<K extends Key, T> = BaseCache<K, T> | Cache<K, T>
export type AsyncInnerCache<K extends Key, T> = InnerCache<K, T> | AsyncCache<K, T> | AbstractCache<K, T>

export type Transformer<K extends AnyCache<any, any>> = <Cache extends AnyCache<any, any>>(cache: Cache) => K
