import type {CacheManager as ICacheManager, Cleanable} from '../types/cacheManager.t'
import CacheManager from './CacheManager'

/**
 * Creates a cache manager
 * @returns {ICacheManager}
 */
const createCacheManager = <T extends Cleanable = Cleanable>(...bases: ICacheManager<T>[]): ICacheManager<T> => {
  return new CacheManager<T>(...bases)
}

export default createCacheManager
