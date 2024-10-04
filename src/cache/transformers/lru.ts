import LruCache from '../implementations/LruCache'
import type {
  AnyCacheType,
  CacheKey,
  CacheValue
} from '../../types/cache.t'
import type {LruCacheOptions} from '../implementations/LruCache/types.t'

// TODO: Make maxSize mandatory
const lru = <C extends AnyCacheType<any, any>>(options: Partial<LruCacheOptions<CacheKey<C>, CacheValue<C>>>) => {
  return (cache: C) => {
    return new LruCache(cache, options)
  }
}

export default lru
