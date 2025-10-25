import type {
  CacheKey,
  CacheValue,
  AnyCacheType
} from '../../types/cache.t'

import RemoteCache from '../implementations/RemoteCache'
import {CleanupPolicies, type SourceOptions} from '../implementations/RemoteCache/constants'

const defaultOptions: Partial<SourceOptions> = {
  cleanupPolicy: CleanupPolicies.NONE
}

const remote = <C extends AnyCacheType<any, any>, K extends AnyCacheType<any, any>>(remoteCache: K, options?: Partial<SourceOptions>) => {
  return (frontCache: C) => {
    return new RemoteCache<CacheKey<C>, CacheValue<C>>(frontCache, remoteCache, {...defaultOptions, ...options}) as unknown as C
  }
}

export default remote
