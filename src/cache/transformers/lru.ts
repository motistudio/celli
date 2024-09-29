import LruCache from '../implementations/LruCache'
import type {
  Key,
  Cache,
  CacheKey,
  CacheValue,
  Transformer,
  AnyCache,
  BaseCache
} from '../../types/cache.t'

// type LruTransformer<C extends AnyCache<any, any>> = Transformer<C, C extends BaseCache<infer K, infer T> ? Cache<K, T> : C>

const lru = <K extends Key, T>(options: NonNullable<ConstructorParameters<typeof LruCache<K, T>>[1]>) => {
  return <C extends AnyCache<K, T> = AnyCache<K, T>>(cache: C): (C extends BaseCache<infer K, infer T> ? Cache<K, T> : C) => {
    return new LruCache(cache, options) as unknown as (C extends BaseCache<infer K, infer T> ? Cache<K, T> : C)
  }
}

export default lru
