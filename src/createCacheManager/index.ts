import reduce from '../commons/iterators/reduce'
import isThentable from '../commons/promise/isThentable'
import singlify from '../commons/promise/singlify'
import type {AnyCacheType} from '../types/cache.t'

const createCacheManager = () => {
  const caches: Set<AnyCacheType<any, any>> = new Set()

  return {
    register: (cache: AnyCacheType<any, any>) => {
      caches.add(cache)
    },
    clean: singlify(() => {
      return Promise.all(reduce<Promise<void>[]>(caches.values(), (promises, cache) => {
        const result = cache.clean()
        if (isThentable(result)) {
          promises.push(result as Promise<void>)
        }
        return promises
      }, []))
    })
  }
}

export default createCacheManager
