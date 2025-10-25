import type {CacheManager} from '../types/cacheManager.t'
import type {Fn} from '../types/commons.t'
import cache from '../memoization/cache'
import {UniversalCacheViaOptions} from '../types/functional.t'

const getUniversalCache = (cacheManager: CacheManager) => {
  const cachify = <F extends Fn>(...args: Parameters<typeof cache<F>>) => {
    const cachedFn = cache<F>(...args)

    if ((args[1] as unknown as UniversalCacheViaOptions<F>).via) {
      return cachedFn
    }

    cacheManager.register(cachedFn)

    return cachedFn
  }

  return cachify as typeof cache
}

export default getUniversalCache
