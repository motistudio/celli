import type {AnyFunction} from '../types/commons.t'
import isThentable from './promise/isThentable'

type OnceFn<C extends AnyFunction> = {
  (...args: Parameters<C>): ReturnType<C>
  clean: () => void
}

/**
 * Caches a function to run only once
 * @template {C} Any function type
 * @param {C} fn - Any function 
 * @returns {OnceFn<C>} The wrapped function, along with a clean callback to reset the cache
 */
const once = <C extends AnyFunction>(fn: C): OnceFn<C> => {
  let result: Awaited<ReturnType<C>> | undefined = undefined
  let isAsync: boolean = false
  let resolved: boolean = false
  let promise: ReturnType<C> extends Promise<any> ? ReturnType<C> | undefined : undefined

  const fnOnce: OnceFn<C> = (...args: Parameters<C>) => {
    // active promise cache, even if it's not resolved yet
    if (promise) {
      return promise
    }

    // if the function has resolved
    if (resolved) {
      if (isAsync) {
        // no need for catching because we know it's resolved already
        promise = Promise.resolve(result).then((result) => {
          promise = undefined
          return result as Awaited<ReturnType<C>>
        }) as (ReturnType<C> extends Promise<any> ? ReturnType<C> | undefined : undefined) // a hell of a casting, but the runtime ensures that

        return promise as ReturnType<C>
      }
      return result as ReturnType<C>
    }

    const fnResult = fn(...args)
    if (isThentable(fnResult)) {
      isAsync = true
      promise = Promise.resolve(fnResult.then((fnResult) => {
        resolved = true
        result = fnResult as Awaited<ReturnType<C>>
        promise = undefined
        return result
      })).catch((e) => {
        promise = undefined
        return Promise.reject(e)
      }) as (ReturnType<C> extends Promise<any> ? ReturnType<C> | undefined : undefined) // a hell of a casting, but the runtime ensures that

      return promise as ReturnType<C>
    }

    // sync behavior
    resolved = true
    result = fnResult
    return fnResult as ReturnType<C>
  }

  const clean = () => {
    result = undefined
    resolved = false
    promise = undefined
  }

  fnOnce.clean = clean

  return fnOnce
}

export default once
