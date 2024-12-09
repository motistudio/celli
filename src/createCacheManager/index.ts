import type {CacheManager as ICacheManager, Cleanable} from '../types/cacheManager.t'
import CacheManager from './CacheManager'

/**
 * Creates a cache manager
 * @returns {ICacheManager}
 */
const createCacheManager = <T extends Cleanable>(): ICacheManager<T> => {
  return new CacheManager<T>()
}

export default createCacheManager
