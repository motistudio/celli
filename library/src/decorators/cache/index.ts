import type {Fn, Simplify} from '../../types/commons.t'
import type {UniversalCacheOptions, UniversalCommonOptions, UniversalMemoOptions, UniversalCacheFromOptions, UniversalCacheViaOptions} from '../../types/functional.t'

import cacheFn from '../../memoization/cache'

type CacheDecorator<F extends Fn> = (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<F>) => TypedPropertyDescriptor<F>

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
function Cache <F extends Fn>(options: Simplify<UniversalCommonOptions<F> & UniversalCacheViaOptions<F> & UniversalMemoOptions<F> & {from?: undefined}>): CacheDecorator<F>
function Cache <F extends Fn>(options: Simplify<UniversalCommonOptions<F> & UniversalMemoOptions<F> & {from?: undefined, via?: undefined}>): CacheDecorator<F>
function Cache <F extends Fn>(options: Simplify<UniversalCommonOptions<F> & UniversalCacheFromOptions<F> & {via?: undefined}>): CacheDecorator<F>
function Cache <F extends Fn>(options: UniversalCacheOptions<F>): CacheDecorator<F> {
  return function (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<F>) {
    if (descriptor?.value) {
      descriptor.value = cacheFn<F>(descriptor.value, options as Parameters<typeof cacheFn<F>>[1]) as unknown as F
    } else {
      throw new Error('Cache decorator can only be applied to methods')
    }
    return descriptor
  }
}

export default Cache
