import AsyncCache from '../implementations/AsyncCache'
import type {
  CacheKey,
  CacheValue,
  AnyCache
} from '../../types/cache.t'

const async = () => {
  return <Cache extends AnyCache<any, any>>(cache: Cache) => {
    return new AsyncCache<CacheKey<Cache>, CacheValue<Cache>>(cache)
  }
}

export default async
