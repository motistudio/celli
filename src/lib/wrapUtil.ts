import type {Fn} from '../types/commons.t'
import type {CacheManager, Cleanable} from '../types/cacheManager.t'

const wrapUtil = <T extends Fn<any[], Cleanable>>(fn: T, cacheManager: CacheManager): T => {
  const wrap = function (this: ThisType<T> | void, ...args: Parameters<T>) {
    const result = fn.apply(this, args)
    cacheManager.register(result)
    return result
  }
  return wrap as T
}

export default wrapUtil
