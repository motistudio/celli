import AsyncCache from '../implementations/AsyncCache'
import type {
  CacheKey,
  CacheValue,
  // Transformer,
  AnyCache
} from '../../types/cache.t'

// type AsyncTransformer<C extends AnyCache<any, any>> = Transformer<AsyncCache<CacheKey<C>, CacheValue<C>>>

const async = () => {
  return <Cache extends AnyCache<any, any>>(cache: Cache) => {
    return new AsyncCache<CacheKey<Cache>, CacheValue<Cache>>(cache)
  }
}

export default async
