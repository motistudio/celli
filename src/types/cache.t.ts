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
  /** Retrieve a value by key */
  get (key: K): T | undefined
  /** Store a value by key */
  set (key: K, value: T): void
  /** Check if a key exists */
  has (key: K): boolean
  /** Remove a value by key */
  delete (key: K): void
  /** Iterator over all keys */
  keys (): IterableIterator<K>
  /** Iterator over all values */
  values (): IterableIterator<T>
  /** Iterator over all key-value pairs */
  entries (): IterableIterator<[K, T]>
  /** Remove all entries */
  clean? (): void,
  [Symbol.iterator] (): IterableIterator<[K, T]>
}

export interface Cache<K extends Key, T> {
  /** Retrieve a value by key */
  get (key: K): T | undefined
  /** Store a value by key */
  set (key: K, value: T): void
  /** Check if a key exists */
  has (key: K): boolean
  /** Remove a value by key */
  delete (key: K): void
  /** Iterator over all keys */
  keys (): IterableIterator<K>
  /** Iterator over all values */
  values (): IterableIterator<T>
  /** Iterator over all key-value pairs */
  entries (): IterableIterator<[K, T]>
  /** Remove all entries */
  clean (): void,
  /** Subscribe to cache events */
  on <
    M extends CacheEventMap<K, T>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
  // on (...args: Parameters<EventEmitter<CacheEventMap<K, T>>['on']>): void
  [Symbol.iterator] (): IterableIterator<[K, T]>
}

export interface AsyncCache<K extends Key, T> {
  /** Retrieve a value by key */
  get (key: K): Promise<T | undefined>
  /** Store a value by key */
  set (key: K, value: T): Promise<void>
  /** Check if a key exists */
  has (key: K): Promise<boolean>
  /** Remove a value by key */
  delete (key: K): Promise<void>
  /** Async iterator over all keys */
  keys (): AsyncIterableIterator<K>
  /** Async iterator over all values */
  values (): AsyncIterableIterator<T>
  /** Async iterator over all key-value pairs */
  entries (): AsyncIterableIterator<[K, T]>
  /** Remove all entries */
  clean (): Promise<void>
  /** Subscribe to cache events */
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
  /** Retrieve a value by key */
  get (...args: Parameters<C['get']>): ReturnType<C['get']>
  /** Store a value by key with lifecycle effects */
  set (key: CacheKey<C>, value: CacheValue<C>, effects: Effect<CacheValue<C>>[]): ReturnType<C['set']>
  /** Check if a key exists */
  has (...args: Parameters<C['has']>): ReturnType<C['has']>
  /** Remove a value by key */
  delete (...args: Parameters<C['delete']>): ReturnType<C['delete']>
  /** Iterator over all keys */
  keys (): ReturnType<C['keys']>
  /** Iterator over all values */
  values (): ReturnType<C['values']>
  /** Iterator over all key-value pairs */
  entries (): ReturnType<C['entries']>
  /** Remove all entries */
  clean (): ReturnType<C['clean']>
  /** Subscribe to cache events */
  on <
    M extends CacheEventMap<CacheKey<C>, CacheValue<C>>,
    EK extends CacheEventMapKey = CacheEventMapKey
  >(eventName: EK, fn: EventListener<M[EK]>): () => void
}

export interface LruCache<C extends AbstractCache<any, any>> {
  /** Retrieve a value by key */
  get (...args: Parameters<C['get']>): ReturnType<C['get']>
  /** Store a value by key (may evict least recently used) */
  set (...args: Parameters<C['set']>): ReturnType<C['set']>
  /** Check if a key exists */
  has (...args: Parameters<C['has']>): ReturnType<C['has']>
  /** Remove a value by key */
  delete (...args: Parameters<C['delete']>): ReturnType<C['delete']>
  /** Iterator over all keys */
  keys (): ReturnType<C['keys']>
  /** Iterator over all values */
  values (): ReturnType<C['values']>
  /** Iterator over all key-value pairs */
  entries (): ReturnType<C['entries']>
  /** Remove all entries */
  clean (): ReturnType<C['clean']>
  /** Subscribe to cache events */
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
