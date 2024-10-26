import type {AnyCacheType} from '../../types/cache.t'
import type {CacheBy, CacheFrom, FnCache, MemoizedFn} from '../../types/memoization.t'
import type {Fn} from '../../types/commons.t'

import reduce from '../../commons/iterators/reduce'

import memo from '../memo'
import getSignatureKey from '../getSignatureKey'
import isThentable from '../../commons/promise/isThentable'

import cleanRefKeys from './cleanRefKeys'

type CacheWithOptions<F extends Fn> = {
  by?: CacheBy<F>,
  from: CacheFrom<F>
}

const getMemoizedInstance = <F extends Fn>(fn: F, cacheBy: CacheBy<F>, cache: FnCache<F>, keySet: Set<WeakRef<AnyCacheType<any, any>>>, instanceMap: WeakMap<AnyCacheType<any, any>, MemoizedFn<F>>) => {
  const cachedMemoizedInstance = instanceMap.get(cache)
  if (cachedMemoizedInstance) {
    return cachedMemoizedInstance
  }

  const memoized = memo(fn, cacheBy, cache)

  // Optimizes the garbage collection
  cleanRefKeys(keySet)
  instanceMap.set(cache, memoized)
  keySet.add(new WeakRef(cache))

  return memoized
}

/**
 * Caches a function dynamically by a given cache
 * @template F - Any function
 * @param {F} fn - Any function 
 * @param {CacheWithOptions<F>} options - Caching options
 * @param {CacheBy<F>} options.by - Cache by callback
 * @param {CacheFrom<F>} options.from - Cache from callback
 * @returns {F}
 */
function cacheWith <F extends Fn>(fn: F, options: CacheWithOptions<F>): MemoizedFn<F> {
  const {by, from} = {by: getSignatureKey, ...options}
  const cacheToInstance = new WeakMap<AnyCacheType<any, any>, MemoizedFn<F>>()
  const keySet2 = new Set<WeakRef<AnyCacheType<any, any>>>()

  const clean = () => {
    return Promise.all(reduce<Promise<void>[]>(keySet2.values(), (promises, cacheRef) => {
      const cache = cacheRef.deref()
      if (cache) {
        const memoized = cacheToInstance.get(cache)
        if (memoized) {
          const result = memoized.clean()
          if (isThentable(result)) {
            promises.push(result)
          }
        }
      }
      return promises
    }, [])).then(() => {
      cleanRefKeys(keySet2)
      return undefined
    })
  }

  const memoized = function (this: ThisType<F> | void, ...args: Parameters<F>): ReturnType<F> {
    const cache = from.apply(this, args)
    return getMemoizedInstance(fn, by, cache, keySet2, cacheToInstance).apply(this, args)
  }

  memoized.clean = clean

  return memoized
}

export default cacheWith
