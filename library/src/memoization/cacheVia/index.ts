import type {CacheBy, CacheManagerFrom, FnCache, MemoizedFn} from '../../types/memoization.t'
import type {Fn} from '../../types/commons.t'

import memo from '../memo'

/**
 * @description Memoize a function with a cache manager
 * @param fn - The function to memoize
 * @param options - The options for the memoization
 * @param options.by - The cache key function
 * @param options.via - The cache manager function
 * @param options.from - The cache manager getter function
 * @returns The memoized function
 */
function cacheVia <F extends Fn>(fn: F, cacheBy: CacheBy<F>, cacheManagerFrom: CacheManagerFrom<F>, cache?: FnCache<F>): MemoizedFn<F> {
  const memoizedFn = memo(fn, cacheBy, cache)

  const memoized = function (this: ThisType<F> | void, ...args: Parameters<F>): ReturnType<F> {
    const cacheManager = cacheManagerFrom.apply(this, args)
    cacheManager.register(memoized)
    return memoizedFn.apply(this, args)
  }

  memoized.clean = memoizedFn.clean

  return memoized
}

export default cacheVia
