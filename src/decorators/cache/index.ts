import type {Fn} from '../../types/commons.t'
import type {UniversalCacheOptions, UniversalCommonOptions, UniversalMemoOptions, UniversalCacheFromOptions, UniversalCacheViaOptions} from '../../types/functional.t'

import cacheFn from '../../memoization/cache'

/**
 * Decorator function for caching method or getter results.
 *
 * @template F - Function type extending Fn
 * @param {UniversalCacheOptions<F>} options - Configuration options for caching
 * @returns {MethodDecorator} - A method decorator function
 *
 * @description
 * This decorator can be used to cache the results of class methods or getters.
 * It supports two main caching strategies:
 * 1. Memoization with custom cache creation options
 * 2. Caching with a provided cache source
 *
 * The caching behavior is determined by the provided options:
 * - If 'from' is present in options, it uses the cacheWith strategy
 * - Otherwise, it uses the memo strategy with a custom cache
 *
 * @example
 * class Example {
 *   @Cache({ cacheBy: (x) => x.toString(), async: true })
 *   expensiveMethod(x: number) {
 *     // ... some expensive computation
 *   }
 * }
 */
function Cache <F extends Fn>(options: UniversalCommonOptions<F> & UniversalCacheViaOptions<F> & UniversalMemoOptions<F>): MethodDecorator
function Cache <F extends Fn>(options: UniversalCommonOptions<F> & UniversalMemoOptions<F>): MethodDecorator
function Cache <F extends Fn>(options: UniversalCommonOptions<F> & UniversalCacheFromOptions<F>): MethodDecorator
function Cache <F extends Fn>(options: UniversalCacheOptions<F>): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (descriptor.value) {
      descriptor.value = cacheFn<F>(descriptor.value, options as Parameters<typeof cacheFn<F>>[1])
    } else {
      throw new Error('Cache decorator can only be applied to methods')
    }
    return descriptor
  }
}

export default Cache
