import type {Key, AsyncCache} from '../../types/cache.t'
import SourceAsyncCache from './SourceAsyncCache'

import type {SourceOptions} from './constants'

/**
 * Creates a source cache instance for external data loading.
 *
 * Can act as a proxy (with set method) forwarding operations to external storage,
 * or as an async cache (without set) that loads missing items on demand via get.
 *
 * @param options - Source configuration with get, and optional set/has methods
 * @returns An async cache instance
 */
const createSource = <K extends Key, T>(options: SourceOptions<K, T>): AsyncCache<K, T> => {
  return new SourceAsyncCache(options)
}

export default createSource
