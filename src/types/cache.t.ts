import type {Effect} from './effects.t'
import type {EventListener} from './eventEmitter.t'

export type Key = string | number | symbol

export type CacheEventMap<K extends Key, T> = {
  'get': [key: K],
  'set': [key: K, value: T],
  'delete': [key: K],
  'clean': []
}

export type CacheEventMapKey = 'get' | 'set' | 'delete' | 'clean'

export type BaseCache<K extends Key, T> = {
  get (key: K): T | undefined
  set (key: K, value: T): void
  has (key: K): boolean
  delete (key: K): void
  keys (): IterableIterator<K>
  values (): IterableIterator<T>
  entries (): IterableIterator<[K, T]>
  clean? (): void,
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
  on <
    M extends CacheEventMap<K, T>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
  // on (...args: Parameters<EventEmitter<CacheEventMap<K, T>>['on']>): void
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
  on <
    M extends CacheEventMap<K, T>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
  [Symbol.asyncIterator] (): AsyncIterableIterator<[K, T]>
}

export type AbstractCache<K extends Key, T> = {
  [P in Exclude<keyof Cache<K, T>, typeof Symbol.asyncIterator | SymbolConstructor['asyncIterator'] | SymbolConstructor['iterator']>]: (...args: Parameters<Cache<K, T>[P]>) => ReturnType<Cache<K, T>[P]> | (P extends keyof AsyncCache<K, T> ? ReturnType<AsyncCache<K, T>[P]> : never)
} & {
  on <
    M extends CacheEventMap<K, T>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
}

export type ACache<K extends Key, T> = Cache<K, T> | AsyncCache<K, T>

export interface WrappedCache<C extends AnyCacheType<any, any>> {
  get (key: CacheKey<C>): ReturnType<C['get']>
  set (key: CacheKey<C>, value: CacheValue<C>): ReturnType<C['set']>
  has (key: CacheKey<C>): ReturnType<C['has']>
  delete (key: CacheKey<C>): ReturnType<C['delete']>
  keys (): ReturnType<C['keys']>
  values (): ReturnType<C['values']>
  entries (): ReturnType<C['entries']>
  clean (): ReturnType<C['clean']>
  [Symbol.iterator] (): IterableIterator<[CacheKey<C>, CacheValue<C>]>
  [Symbol.asyncIterator] (): AsyncIterableIterator<[CacheKey<C>, CacheValue<C>]>
}

export interface LifeCycleCache<C extends AbstractCache<any, any>> {
  get (...args: Parameters<C['get']>): ReturnType<C['get']>
  set (key: CacheKey<C>, value: CacheValue<C>, effects: Effect<CacheValue<C>>[]): ReturnType<C['set']>
  has (...args: Parameters<C['has']>): ReturnType<C['has']>
  delete (...args: Parameters<C['delete']>): ReturnType<C['delete']>
  keys (): ReturnType<C['keys']>
  values (): ReturnType<C['values']>
  entries (): ReturnType<C['entries']>
  clean (): ReturnType<C['clean']>
  on <
    M extends CacheEventMap<CacheKey<C>, CacheValue<C>>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
}

export interface LruCache<C extends AbstractCache<any, any>> {
  get (...args: Parameters<C['get']>): ReturnType<C['get']>
  set (...args: Parameters<C['set']>): ReturnType<C['set']>
  has (...args: Parameters<C['has']>): ReturnType<C['has']>
  delete (...args: Parameters<C['delete']>): ReturnType<C['delete']>
  keys (): ReturnType<C['keys']>
  values (): ReturnType<C['values']>
  entries (): ReturnType<C['entries']>
  clean (): ReturnType<C['clean']>
  on <
    M extends CacheEventMap<CacheKey<C>, CacheValue<C>>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
}

export type AnyCache<K extends Key, T> = BaseCache<K, T> | Cache<K, T> | AsyncCache<K, T> | AbstractCache<K, T>
export type AnyCacheType<K extends Key, T> = Cache<K, T> | AsyncCache<K, T> | AbstractCache<K, T> | LruCache<AbstractCache<K, T>>

export type CacheKey<C extends AnyCache<Key, any>> = (
  C extends AnyCache<infer K, any> ? K : never
)

export type CacheValue<C extends AnyCache<Key, any>> = (
  C extends AnyCache<any, infer T> ? T : never
)

export type InnerCache<K extends Key, T> = BaseCache<K, T> | Cache<K, T>
export type AsyncInnerCache<K extends Key, T> = InnerCache<K, T> | AsyncCache<K, T> | AbstractCache<K, T>

export type Transformer<K extends AnyCache<any, any>> = <Cache extends AnyCache<any, any>>(cache: Cache) => K

export type Cleanable = {
  clean: () => Promise<void> | void
}

export type CacheManager = {
  register: (cache: Cleanable) => void
  clean: () => Promise<void>
}

