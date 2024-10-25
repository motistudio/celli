import type {Fn} from '../../types/commons.t'
import type {CacheBy, CacheFrom} from '../../types/memoization.t'
import type {CacheCreationOptions} from '../../types/functional.t'

import once from '../../commons/once'

import createCache from '../../memoization/cache'
import cacheWith from '../../memoization/cacheWith'
import memo from '../../memoization/memo'

type CommonOptions<F extends Fn> = {
  cacheBy?: CacheBy<F>
}

type MemoOptions<F extends Fn> = CacheCreationOptions<string, Awaited<ReturnType<F>>>
type CacheWithOptions<F extends Fn> = {
  from: CacheFrom<F>
}

const isCacheWithOptions = <F extends Fn>(options: CommonOptions<F> & (MemoOptions<F> | CacheWithOptions<F>)): options is (CommonOptions<F> & CacheWithOptions<F>) => {
  return ('from' in options)
}

function cacheFn <F extends Fn>(fn: F, options: CommonOptions<F> & (MemoOptions<F> | CacheWithOptions<F>)) {
  if (isCacheWithOptions(options)) {
    return cacheWith(fn, {
      by: options.cacheBy,
      from: options.from
    })
  }
  const {cacheBy, ...rest} = options
  return memo(fn, options.cacheBy, createCache<string, Awaited<ReturnType<Fn>>>(rest as Parameters<typeof createCache<string, Awaited<ReturnType<Fn>>>>[0]))
}

/**
 * Decorator function for caching method or getter results.
 * 
 * @template F - Function type extending Fn
 * @param {CommonOptions<F> & (MemoOptions<F> | CacheWithOptions<F>)} options - Configuration options for caching
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
function Cache<F extends Fn>(options: CommonOptions<F> & CacheWithOptions<F>): MethodDecorator
function Cache<F extends Fn>(options: CommonOptions<F> & MemoOptions<F>): MethodDecorator
function Cache<F extends Fn>(options: CommonOptions<F> & (MemoOptions<F> | CacheWithOptions<F>)) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (descriptor.value) {
      descriptor.value = cacheFn(descriptor.value, options) as F
    } else {
      throw new Error('Cache decorator can only be applied to methods')
    }
    return descriptor
  }
}

export default Cache
