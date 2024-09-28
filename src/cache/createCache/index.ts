import type {Key} from '../../types/cache.t'
import Cache from '../Cache'

/**
 * Allows customizations for cache, returns a new class instance
 */
const createCache = <K extends Key, T>() => {
  return new Cache<K, T>()
}

export default createCache
