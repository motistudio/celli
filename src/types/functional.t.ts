import type {Merge} from './commons.t'
import type {
  Key,
  AsyncCache
} from './cache.t'
import type {Effect} from './effects.t'

// LRU:
export type LruItemSizeGetter<K extends Key, T> = (key: K, value: T) => number

export type LruCacheOptions<K extends Key, T> = {
  maxSize: number,
  getItemSize: LruItemSizeGetter<K, T>
}

export type CacheCreationOptions<K extends Key, T> = {
  async: boolean,
  ttl: number,
  lru: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>,
  source?: AsyncCache<K, T>,
  dispose?: (value: T) => void | Promise<void>,
  effects?: Effect<T>[]
}
