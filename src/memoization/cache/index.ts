import type {Merge} from '../../types/commons.t'
import type {
  Key,
  AsyncCache as IAsyncCache,
  Cache as ICache,
  // LifeCycleCache as ILifeCycleCache,
  AnyCacheType
} from '../../types/cache.t'
import type {LruCacheOptions} from '../../cache/implementations/LruCache/types.t'
// import type {Effect} from '../../types/effects.t'

import createBaseCache from '../../cache/createCache'
import async from '../../cache/transformers/async'
import backup from '../../cache/transformers/backup'
import lru from '../../cache/transformers/lru'
import effects from '../../cache/transformers/effects'
import ttl from '../../cache/implementations/LifeCycleCache/effects/ttl'

type CacheOptions<K extends Key, T> = {
  async: boolean,
  ttl: number,
  lru: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>,
  source?: IAsyncCache<K, T>
  // effects: Effect<T>[]
}

const defaultCacheOptions: CacheOptions<any, any> = {
  async: false,
  ttl: Infinity,
  lru: 1000
}

const getLruOptions = <K extends Key, T>(lruOptions: number | Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>>): Merge<Partial<LruCacheOptions<K, T>>, Pick<LruCacheOptions<K, T>, 'maxSize'>> => {
  if (typeof lruOptions === 'number') {
    return {maxSize: lruOptions}
  }
  return lruOptions
}

function createCache <K extends Key, T>(options?: Merge<Omit<Partial<CacheOptions<K, T>>, 'source'>, {async?: false}>): ICache<K, T>
// function createCache <K extends Key, T>(options: Merge<Partial<CacheOptions<K, T>>, {async: false, effects: Effect<T>[]}>): ILifeCycleCache<ICache<K, T>>
function createCache <K extends Key, T>(options?: Merge<Partial<CacheOptions<K, T>>, {async: true}>): IAsyncCache<K, T>
function createCache <K extends Key, T>(options?: Merge<Partial<CacheOptions<K, T>>, {source: IAsyncCache<K, T>}>): IAsyncCache<K, T>
// function createCache <K extends Key, T>(options: Merge<Partial<CacheOptions<K, T>>, {async: true, effects: Effect<T>[]}>): ILifeCycleCache<IAsyncCache<K, T>>
function createCache <K extends Key, T>(options?: Partial<CacheOptions<K, T>>): AnyCacheType<K, T> {
  const {async: isAsync, ttl: timeout, lru: lruInput, source} = {...defaultCacheOptions, ...options}

  const lruOptions = getLruOptions(lruInput)

  // Manual compose
  let cache: AnyCacheType<K, T> = createBaseCache<K, T>()
  // lru and timeout are very connected, since effects have to cleanup and so do the keys
  // TODO: Expose events. There's no running away from it.
  cache = lru(lruOptions)(cache)
  cache = timeout !== Infinity ? effects([ttl({timeout})])(cache) : cache
  cache = source ? backup(source)(cache) : cache
  cache = (isAsync || source) ? async()(cache) as AnyCacheType<K, T> : cache

  return cache
}

export default createCache
