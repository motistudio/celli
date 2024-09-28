import type {Key} from '../types/cache.t'
import AsyncCache from './AsyncCache'

/**
 * Allows customizations for cache, returns a new class instance
 */
const createAsyncCache = <K extends Key, T>(...args: ConstructorParameters<typeof AsyncCache<K, T>>) => {
  return new AsyncCache<K, T>(...args)
}

export default createAsyncCache
