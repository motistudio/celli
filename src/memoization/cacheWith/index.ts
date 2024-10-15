import type {AnyCacheType} from '../../types/cache.t'
import type {Fn} from '../../types/commons.t'

import memo from '../memo'

type CacheBy<C extends Fn> = (...args: Parameters<C>) => string
type CacheFrom<C extends Fn> = (...args: Parameters<C>) => FnCache<C>

type FnCache<C extends Fn> = AnyCacheType<string, Awaited<ReturnType<C>>>

type CacheWithOptions<C extends Fn> = {
  by: CacheBy<C>,
  from: CacheFrom<C>
}

const getMemoizedInstance = <C extends Fn>(fn: C, cacheBy: CacheBy<C>, cache: FnCache<C>, instanceMap: WeakMap<AnyCacheType<any, any>, C>) => {
  const cachedMemoizedInstance = instanceMap.get(cache)
  if (cachedMemoizedInstance) {
    return cachedMemoizedInstance
  }

  const memoized = memo(fn, cacheBy, cache)
  instanceMap.set(cache, memoized as C)
  return memoized as C
}

/**
 * Caches a function dynamically by a given cache
 * @template {C} - Any function
 * @param {C} fn - Any function 
 * @param {CacheWithOptions<C>} options - Caching options
 * @param {CacheBy<C>} options.by - Cache by callback
 * @param {CacheFrom<C>} options.from - Cache from callback
 * @returns {C}
 */
const cacheWith = <C extends Fn>(fn: C, {by, from}: CacheWithOptions<C>) => {
  const cacheToInstance = new WeakMap<AnyCacheType<any, any>, C>()

  return (...args: Parameters<C>): ReturnType<C> => {
    const cache = from(...args)
    return getMemoizedInstance(fn, by, cache, cacheToInstance)(...args)
  }
}

export default cacheWith
