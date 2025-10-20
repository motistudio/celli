import type {Simplify} from 'type-fest'

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
  /** Maximum total size of cache items */
  maxSize: number,
  /** Function to calculate the size of each item */
  getItemSize: LruItemSizeGetter<K, T>
}

export type CacheCreationOptions<K extends Key, T> = {
  /** Enable async cache operations */
  async?: boolean,
  /** Time-to-live in milliseconds for cache entries */
  ttl?: number,
  /** LRU eviction policy (number = maxSize, or full options) */
  lru?: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>,
  /** Remote/persistent cache source */
  source?: AsyncCache<K, T>,
  /** Cleanup function called when entries are evicted */
  dispose?: (value: T) => void | Promise<void>,
  /** Lifecycle effects for cache entries */
  effects?: Effect<T>[]
}

// Universal cache options

/**
 * Common options for all cache types
 */
export type UniversalCommonOptions<F extends Fn> = {
  /** Custom function to generate cache keys from arguments */
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
  /** Function that returns a cache instance to use */
  from: CacheFrom<F>
}

export type UniversalCacheViaOptions<F extends Fn> = {
  /** Function that returns a cache manager to register with */
  via: CacheManagerFrom<F>
}

export type UniversalCacheOptions<F extends Fn> = Simplify<UniversalCommonOptions<F> & ((UniversalMemoOptions<F> | UniversalCacheFromOptions<F>) | (UniversalMemoOptions<F> & UniversalCacheViaOptions<F>))>
