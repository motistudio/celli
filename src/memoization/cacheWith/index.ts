import type {AnyCacheType} from '../../types/cache.t'
import type {CacheBy, CacheFrom, FnCache} from '../../types/memoization.t'
import type {Fn} from '../../types/commons.t'

import memo from '../memo'
import getSignatureKey from '../getSignatureKey'

type CacheWithOptions<F extends Fn> = {
  by?: CacheBy<F>,
  from: CacheFrom<F>
}

const getMemoizedInstance = <F extends Fn>(fn: F, cacheBy: CacheBy<F>, cache: FnCache<F>, instanceMap: WeakMap<AnyCacheType<any, any>, F>) => {
  const cachedMemoizedInstance = instanceMap.get(cache)
  if (cachedMemoizedInstance) {
    return cachedMemoizedInstance
  }

  const memoized = memo(fn, cacheBy, cache)
  instanceMap.set(cache, memoized as unknown as F)
  return memoized as unknown as F
}

/**
 * Caches a function dynamically by a given cache
 * @template {F} - Any function
 * @param {F} fn - Any function 
 * @param {CacheWithOptions<F>} options - Caching options
 * @param {CacheBy<F>} options.by - Cache by callback
 * @param {CacheFrom<F>} options.from - Cache from callback
 * @returns {F}
 */
const cacheWith = <F extends Fn>(fn: F, options: CacheWithOptions<F>) => {
  const {by, from} = {by: getSignatureKey, ...options}
  const cacheToInstance = new WeakMap<AnyCacheType<any, any>, F>()

  return (...args: Parameters<F>): ReturnType<F> => {
    const cache = from(...args)
    return getMemoizedInstance(fn, by, cache, cacheToInstance)(...args)
  }
}

export default cacheWith
