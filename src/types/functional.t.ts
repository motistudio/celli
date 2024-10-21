import type {Merge} from './commons.t'
import type {
  Key,
  AsyncCache as IAsyncCache,
  Cache as ICache,
  // LifeCycleCache as ILifeCycleCache,
  AnyCacheType
} from './cache.t'

// LRU:
export type LruItemSizeGetter<K extends Key, T> = (key: K, value: T) => number

export type LruCacheOptions<K extends Key, T> = {
  maxSize: number,
  getItemSize: LruItemSizeGetter<K, T>
}

// TODO: Add dispose()
export type CacheCreationOptions<K extends Key, T> = {
  async: boolean,
  ttl: number,
  lru: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>,
  source?: IAsyncCache<K, T>
  // effects: Effect<T>[]
}
