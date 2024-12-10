import type {Fn} from '../types/commons.t'
import type {CacheManager, Cleanable} from '../types/cacheManager.t'
import Cache from '../decorators/cache'
import {UniversalCacheViaOptions} from '../types/functional.t'

const getCacheDecorator = (cacheManager: CacheManager): typeof Cache => {
  const CacheDecorator = function <F extends Fn>(options: Parameters<typeof Cache<F>>[0]) {
    if (!(options as unknown as UniversalCacheViaOptions<F>).via) {
      const decoratorFn = Cache(options)
      return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const memoizedFn = decoratorFn(target, propertyKey, descriptor)
        cacheManager.register(descriptor.value as Cleanable)
        return memoizedFn
      } as ReturnType<typeof Cache<F>>
    }
    return Cache(options)
  }

  return CacheDecorator as typeof Cache
}

export default getCacheDecorator
