import type {CacheManager as ICacheManager, Cleanable} from '../types/cacheManager.t'

import CacheManager from './CacheManager'

/**
 * Creates a CacheManager instance.
 *
 * If provided with other CacheManager instances, it will share their resources.
 * The CacheManager can manage any object that implements a clean() method (Cleanable).
 *
 * @param bases - Optional CacheManager instances to share resources with
 * @returns A new CacheManager instance
 */
function createCacheManager <T extends Cleanable = Cleanable>(...bases: ICacheManager<T>[]): ICacheManager<T> {
  return new CacheManager<T>(...bases)
}

export default createCacheManager
