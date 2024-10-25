import type {CacheManager, Cleanable} from '../types/cache.t'

import reduce from '../commons/iterators/reduce'
import isThentable from '../commons/promise/isThentable'
import singlify from '../commons/promise/singlify'

const createCacheManager = (): CacheManager => {
  const caches: Set<Cleanable> = new Set()

  return {
    register: (cache: Cleanable) => {
      caches.add(cache)
    },
    clean: singlify(() => {
      return Promise.all(reduce<Promise<void>[]>(caches.values(), (promises, cache) => {
        const result = cache.clean()
        if (isThentable(result)) {
          promises.push(result as Promise<void>)
        }
        return promises
      }, [])).then(() => undefined)
    })
  }
}

export default createCacheManager
