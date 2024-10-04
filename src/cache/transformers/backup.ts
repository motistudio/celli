import type {
  CacheKey,
  CacheValue,
  AnyCacheType
} from '../../types/cache.t'

import BackupCache from '../implementations/BackupCache'
import {CleanupPolicies, type SourceOptions} from '../implementations/BackupCache/constants'

const defaultOptions: Partial<SourceOptions> = {
  cleanupPolicy: CleanupPolicies.NONE
}

const backup = <C extends AnyCacheType<any, any>, K extends AnyCacheType<any, any>>(backupCache: K, options?: Partial<SourceOptions>) => {
  return (frontCache: C) => {
    return new BackupCache<CacheKey<C>, CacheValue<C>>(frontCache, backupCache, {...defaultOptions, ...options}) as unknown as C
  }
}

export default backup
