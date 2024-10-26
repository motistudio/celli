import type {Merge} from '../../types/commons.t'
import type {
  Key,
  AsyncCache as IAsyncCache,
  Cache as ICache,
  AnyCacheType
} from '../../types/cache.t'
import type {LruCacheOptions, CacheCreationOptions} from '../../types/functional.t'
import type {Effect} from '../../types/effects.t'

import createBaseCache from '../../cache/createCache'
import async from '../../cache/transformers/async'
import backup from '../../cache/transformers/backup'
import lru from '../../cache/transformers/lru'
import effects from '../../cache/transformers/effects'
import ttl from '../../cache/implementations/LifeCycleCache/effects/ttl'

const defaultCacheOptions: CacheCreationOptions<any, any> = {
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

const createDisposeEffect = <T>(dispose: (value: T) => void | Promise<void>): Effect<T> => {
  return (api) => {
    return () => dispose(api.getSelf())
  }
}

function createCache <K extends Key, T>(options?: Merge<Omit<Partial<CacheCreationOptions<K, T>>, 'source'>, {async?: false}>): ICache<K, T>
// function createCache <K extends Key, T>(options: Merge<Partial<CacheOptions<K, T>>, {async: false, effects: Effect<T>[]}>): ILifeCycleCache<ICache<K, T>>
function createCache <K extends Key, T>(options?: Merge<Partial<CacheCreationOptions<K, T>>, {async: true}>): IAsyncCache<K, T>
function createCache <K extends Key, T>(options?: Merge<Partial<CacheCreationOptions<K, T>>, {source: IAsyncCache<K, T>}>): IAsyncCache<K, T>
// function createCache <K extends Key, T>(options: Merge<Partial<CacheOptions<K, T>>, {async: true, effects: Effect<T>[]}>): ILifeCycleCache<IAsyncCache<K, T>>
function createCache <K extends Key, T>(options?: Partial<CacheCreationOptions<K, T>>): AnyCacheType<K, T> {
  const {
    async: isAsync,
    ttl: timeout,
    lru: lruInput,
    source,
    dispose,
    effects: effectsInput
  } = {...defaultCacheOptions, ...options}

  const lruOptions = getLruOptions(lruInput)

  const computedEffects: Effect<T>[] = [
    ...(effectsInput || []),
    ...(dispose ? [createDisposeEffect(dispose)] : []),
    ...(timeout !== Infinity ? [ttl({timeout})] : [])
  ]

  // Manual compose
  let cache: AnyCacheType<K, T> = createBaseCache<K, T>()
  cache = lru(lruOptions)(cache)
  cache = computedEffects.length ? effects(computedEffects)(cache) : cache
  cache = source ? backup(source)(cache) : cache
  cache = (isAsync || source) ? async()(cache) as AnyCacheType<K, T> : cache // async should always be the last since it's synchronizing the cache's methods and normalizes a specific behavior

  return cache
}

export default createCache
