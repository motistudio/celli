import type {CacheManager, Cleanable} from '../types/cache.t'

type Decorator = (...args: any[]) => MethodDecorator

function wrapDecorator<D extends Decorator>(
  decorator: D,
  cacheManager: CacheManager
): D {
  return (function wrappedDecorator(...args: Parameters<D>): ReturnType<D> {
    const decoratorFn = decorator(...args)
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      const memoizedFn = decoratorFn(target, propertyKey, descriptor)
      cacheManager.register(descriptor.value as Cleanable)
      return memoizedFn
    } as ReturnType<D>
  }) as unknown as D
}

export default wrapDecorator
