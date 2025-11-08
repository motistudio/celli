import type {Fn, Merge} from '../types/commons.t'
import type {MemoizedFn} from '../types/memoization.t'

import isThentable from './promise/isThentable'

type OnceFn<F extends Fn> = Merge<MemoizedFn<F>, {
  (this: ThisType<F> | void, ...args: Parameters<F>): ReturnType<F>
  clean: () => void
}>

/**
 * Ensures a function is only called once, caching its result.
 *
 * Works for both sync and async functions, caching promises for async functions.
 * Not recommended for functions with arguments as it caches based on function identity.
 *
 * @param fn - The function to call once
 * @returns Wrapped function with clean() method to reset the cache
 */
function once <F extends Fn>(fn: F): OnceFn<F> {
  let result: Awaited<ReturnType<F>> | undefined = undefined
  let isAsync: boolean = false
  let resolved: boolean = false
  let promise: ReturnType<F> extends Promise<any> ? ReturnType<F> | undefined : undefined

  const fnOnce: OnceFn<F> = function (this: ThisType<F> | void, ...args: Parameters<F>) {
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
          return result as Awaited<ReturnType<F>>
        }) as (ReturnType<F> extends Promise<any> ? ReturnType<F> | undefined : undefined) // a hell of a casting, but the runtime ensures that

        return promise as ReturnType<F>
      }
      return result as ReturnType<F>
    }

    const fnResult = fn.apply(this, args)
    if (isThentable(fnResult)) {
      isAsync = true
      promise = Promise.resolve(fnResult.then((fnResult) => {
        resolved = true
        result = fnResult as Awaited<ReturnType<F>>
        promise = undefined
        return result
      })).catch((e) => {
        promise = undefined
        return Promise.reject(e)
      }) as (ReturnType<F> extends Promise<any> ? ReturnType<F> | undefined : undefined) // a hell of a casting, but the runtime ensures that

      return promise as ReturnType<F>
    }

    // sync behavior
    resolved = true
    result = fnResult
    return fnResult as ReturnType<F>
  }

  const clean = function () {
    result = undefined
    resolved = false
    promise = undefined
  }

  fnOnce.clean = clean

  return fnOnce
}

export default once
