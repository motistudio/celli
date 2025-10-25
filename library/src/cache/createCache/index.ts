import type {Key} from '../../types/cache.t'
import Cache from '../implementations/Cache'

/**
 * Creates a basic synchronous cache instance.
 *
 * Returns a simple Map-like cache with get, set, delete, has methods and iteration support.
 * This is the foundation that other cache transformers can build upon.
 *
 * @returns A new synchronous cache instance
 */
const createCache = <K extends Key, T>() => {
  return new Cache<K, T>()
}

export default createCache
