import type {Fn} from '../../types/commons.t'
import type {CacheBy, FnCache} from '../../types/memoization.t'

import Cache from '../../cache/implementations/Cache'
import evaluate from '../../commons/evaluate'
import isThentable from '../../commons/promise/isThentable'
import promisify from '../../commons/promise/promisify'

import getSignatureKey from '../getSignatureKey'

const registerPromise = <T>(promisesCache: Cache<string, Promise<T>>, key: string, promise: PromiseLike<T>): Promise<T> => {
  const computedPromise = Promise.resolve(promise).then((result) => {
    promisesCache.delete(key)
    return result
  }).catch((e) => {
    promisesCache.delete(key)
    return Promise.reject(e)
  })
  promisesCache.set(key, computedPromise)

  return computedPromise
}

/**
 * Memoizes a function
 * @param {Fn} fn - Any function 
 * @param {CacheBy<Fn>?} cacheBy - An optional cache-by function
 * @param {AnyCacheType<string, Awaited<ReturnType<Fn>>>?} cache - An optional key to work with
 * @returns {Fn} A memoized instance of the original function
 */
function memo <F extends Fn>(fn: F, cacheBy?: CacheBy<F>, cache?: FnCache<F>) {
  const getKey = cacheBy || (getSignatureKey as CacheBy<F>)
  const computedCache: FnCache<F> = cache || new Cache<string, Awaited<ReturnType<F>>>()
  const cachedPromises = new Cache<string, Promise<Awaited<ReturnType<F>>>>()
  let isAsync: boolean = false

  const memoized = (...args: Parameters<F>): ReturnType<F> => {
    const key = getKey(...args)

    if (cachedPromises.has(key)) {
      return cachedPromises.get(key) as ReturnType<F>
    }

    const potentialPromise = evaluate(computedCache.has(key), (isExist) => {
      if (isExist) {
        const cached = computedCache.get(key) as Awaited<ReturnType<F>>
        return isAsync ? registerPromise<Awaited<ReturnType<F>>>(cachedPromises, key, promisify(cached)) : cached
      }
      const result = fn(...args) as ReturnType<F>
      isAsync = isAsync || isThentable(result);

      return evaluate(result, (result) => {
        return evaluate(computedCache.set(key, result as Awaited<ReturnType<F>>), () => result)
      })
    })

    if (isThentable(potentialPromise)) {
      return registerPromise<Awaited<ReturnType<F>>>(cachedPromises, key, potentialPromise as Awaited<ReturnType<F>>) as ReturnType<F>
    }

    return potentialPromise
  }

  return memoized
}

export default memo
