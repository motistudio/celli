import type {Fn} from '../types/commons.t'
import type {CacheManager, Cleanable} from '../types/cache.t'

import wrapUtil from './wrapUtil'

const wrapTransformer = <F extends Fn<any[], Fn<any[], Cleanable>>>(fn: F, cacheManager: CacheManager): F => {
  return function (this: ThisType<F> | void, ...args: Parameters<F>) {
    return wrapUtil(fn.apply(this, args), cacheManager)
  } as F
}

export default wrapTransformer
