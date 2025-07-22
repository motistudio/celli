import type {Fn, Merge} from './commons.t'
import type {
  Key,
  AsyncCache
} from './cache.t'
import type {Effect} from './effects.t'
import type {CacheBy, CacheFrom, CacheManagerFrom} from './memoization.t'

// LRU:
export type LruItemSizeGetter<K extends Key, T> = (key: K, value: T) => number

export type LruCacheOptions<K extends Key, T> = {
  maxSize: number,
  getItemSize: LruItemSizeGetter<K, T>
}

export type CacheCreationOptions<K extends Key, T> = {
  async?: boolean,
  ttl?: number,
  lru?: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>,
  source?: AsyncCache<K, T>,
  dispose?: (value: T) => void | Promise<void>,
  effects?: Effect<T>[]
}

// Universal cache options

/**
 * Common options for all cache types
 */
export type UniversalCommonOptions<F extends Fn> = {
  cacheBy?: CacheBy<F>
}

/**
 * Memoization options
 */
export type UniversalMemoOptions<F extends Fn> = CacheCreationOptions<string, Awaited<ReturnType<F>>>

/**
 * Cache from options
 */
export type UniversalCacheFromOptions<F extends Fn> = {
  from: CacheFrom<F>
}

export type UniversalCacheViaOptions<F extends Fn> = {
  via: CacheManagerFrom<F>
}

export type UniversalCacheOptions<F extends Fn> = UniversalCommonOptions<F> & ((UniversalMemoOptions<F> | UniversalCacheFromOptions<F>) | (UniversalMemoOptions<F> & UniversalCacheViaOptions<F>))
