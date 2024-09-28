import type {Key} from '../types/cache.t'
import LruCache from './LruCache'

/**
 * Allows customizations for cache, returns a new class instance
 */
const createLruCache = <K extends Key, T>(...args: ConstructorParameters<typeof LruCache<K, T>>) => {
  return new LruCache<K, T>(...args)
}

export default createLruCache
