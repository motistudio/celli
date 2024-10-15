import AsyncCache from '../../cache/implementations/AsyncCache'
import Cache from '../../cache/implementations/Cache'
import evaluate from '../../commons/evaluate'
import isThentable from '../../commons/promise/isThentable'
import promisify from '../../commons/promise/promisify'
import type {AnyCacheType} from '../../types/cache.t'
import type {Fn} from '../../types/commons.t'

import getSignatureKey from '../getSignatureKey'

type CacheBy<C extends Fn> = (...args: Parameters<C>) => string

type FnCache<C extends Fn> = AnyCacheType<string, Awaited<ReturnType<C>>>

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
function memo <C extends Fn>(fn: C, cacheBy?: CacheBy<C>, cache?: FnCache<C>) {
  const getKey = cacheBy || (getSignatureKey as CacheBy<C>)
  const computedCache: FnCache<C> = cache || new Cache<string, Awaited<ReturnType<C>>>()
  const cachedPromises = new Cache<string, Promise<Awaited<ReturnType<C>>>>()
  let isAsync: boolean = false

  const memoized = (...args: Parameters<C>): ReturnType<C> => {
    const key = getKey(...args)

    if (cachedPromises.has(key)) {
      return cachedPromises.get(key) as ReturnType<C>
    }

    const potentialPromise = evaluate(computedCache.has(key), (isExist) => {
      if (isExist) {
        const cached = computedCache.get(key) as Awaited<ReturnType<C>>
        return isAsync ? registerPromise<Awaited<ReturnType<C>>>(cachedPromises, key, promisify(cached)) : cached
      }
      const result = fn(...args) as ReturnType<C>
      isAsync = isAsync || isThentable(result);

      return evaluate(result, (result) => {
        return evaluate(computedCache.set(key, result as Awaited<ReturnType<C>>), () => result)
      })
    })

    if (isThentable(potentialPromise)) {
      return registerPromise<Awaited<ReturnType<C>>>(cachedPromises, key, potentialPromise as Awaited<ReturnType<C>>) as ReturnType<C>
    }

    return potentialPromise
  }

  return memoized
}

export default memo
