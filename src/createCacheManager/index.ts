import type {CacheManager as ICacheManager, Cleanable} from '../types/cacheManager.t'
import CacheManager from './CacheManager'

/**
 * Creates a cache manager
 * @returns {ICacheManager}
 */
const createCacheManager = <T extends Cleanable>(base?: ICacheManager<T>): ICacheManager<T> => {
  return new CacheManager<T>(base)
}

export default createCacheManager
