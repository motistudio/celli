import type {Key, AsyncCache, AnyCache} from '../../types/cache.t'
import SourceAsyncCache from './SourceAsyncCache'

import type {SourceOptions} from './constants'

const createSource = <K extends Key, T>(options: SourceOptions<K, T>): AsyncCache<K, T> => {
  return new SourceAsyncCache(options)
}

export default createSource
