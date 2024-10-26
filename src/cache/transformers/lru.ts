import LruCache from '../implementations/LruCache'
import type {
  Key,
  AnyCacheType,
  CacheKey,
  CacheValue
} from '../../types/cache.t'
import type {LruCacheOptions, LruItemSizeGetter} from '../../types/functional.t'
import {Merge} from '../../types/commons.t'

type LruOptions<K extends Key, T> = Merge<LruCacheOptions<K, T>, {
  getItemSize?: LruItemSizeGetter<K, T>
}>

const lru = <C extends AnyCacheType<any, any>>(options: LruOptions<CacheKey<C>, CacheValue<C>>) => {
  return (cache: C) => {
    return new LruCache(cache, options)
  }
}

export default lru
