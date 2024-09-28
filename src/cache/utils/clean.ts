import type {Key, Cache, AsyncCache, AsyncInnerCache} from '../../types/cache.t'

/**
 * Cleans a given cache
 */
const clean = <C extends AsyncInnerCache<any, any>>(cache: C) => {
  if (typeof (cache as (Cache<any, any> | AsyncCache<any, any>)).clean === 'function') {
    return (cache as (Cache<any, any> | AsyncCache<any, any>)).clean()
  }
}

export default clean
