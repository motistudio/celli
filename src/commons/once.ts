import type {Fn, Merge} from '../types/commons.t'
import type {MemoizedFn} from '../types/memoization.t'

import isThentable from './promise/isThentable'

type OnceFn<F extends Fn> = Merge<MemoizedFn<F>, {
  (this: ThisType<F> | void, ...args: Parameters<F>): ReturnType<F>
  clean: () => void
}>

/**
 * Caches a function to run only once
 * @template {C} Any function type
 * @param {F} fn - Any function
 * @returns {OnceFn<F>} The wrapped function, along with a clean callback to reset the cache
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
