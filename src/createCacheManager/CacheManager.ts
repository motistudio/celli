import type {Cleanable, CacheManager as ICacheManager} from '../types/cache.t'

import reduce from '../commons/iterators/reduce'
import isThentable from '../commons/promise/isThentable'
import singlify from '../commons/promise/singlify'

const cacheManagerRefCount = new WeakMap<Cleanable, number>()

const getCacheRefCount = (cache: Cleanable) => {
  return cacheManagerRefCount.get(cache) || 0
}

const unregisterByRef = <T extends Cleanable>(cacheManager: CacheManager<T>, cache: T) => {
  if (cacheManager.collection.has(cache)) {
    const refCount = getCacheRefCount(cache)
    if (refCount && refCount > 1) {
      cacheManagerRefCount.set(cache, refCount - 1)
    } else {
      cacheManagerRefCount.delete(cache)
    }
    cacheManager.collection.delete(cache)
  }
}

class CacheManager<T extends Cleanable> implements ICacheManager<T> {
  public collection: Set<T>
  public namedCollection: Map<string, T>
  public collectionNames: Map<T, string>

  constructor () {
    this.collection = new Set()
    this.namedCollection = new Map()
    this.collectionNames = new Map()

    this.clean = singlify(this.clean.bind(this))
    this.clear = singlify(this.clear.bind(this))
    this.register = this.register.bind(this)
    this.unregister = this.unregister.bind(this)
    this.getByName = this.getByName.bind(this)
  }

  getByName (name: string): T | undefined {
    return this.namedCollection.get(name)
  }

  register (cache: T, name?: string) {
    if (!this.collection.has(cache)) {
      // Updating the ref count
      cacheManagerRefCount.set(cache, getCacheRefCount(cache) + 1)

      this.collection.add(cache)
      if (name) {
        this.namedCollection.set(name, cache)
        this.collectionNames.set(cache, name)
      }
    }
  }

  unregister (cache: T) {
    unregisterByRef(this, cache)

    // Removes named pair
    const name = this.collectionNames.get(cache)
    if (name) {
      this.namedCollection.delete(name)
      this.collectionNames.delete(cache)
    }
  }

  clear (force?: boolean) {
    return Promise.all(reduce<Promise<void>[]>(this.collection.values(), (promises, cache) => {
      // Clear only if this is the last ref (unless it's forced)
      if (!force && getCacheRefCount(cache) > 1) {
        this.unregister(cache)
        return promises
      }

      const result = cache.clean()
      if (isThentable(result)) {
        promises.push((result as Promise<void>).then((result) => {
          this.unregister(cache)
          return result
        }))
      } else {
        this.unregister(cache)
      }
      return promises
    }, [])).then(() => {
      return undefined
    })
  }

  clean () {
    return Promise.all(reduce<Promise<void>[]>(this.collection.values(), (promises, cache) => {
      const result = cache.clean()
      if (isThentable(result)) {
        promises.push(result as Promise<void>)
      }
      return promises
    }, [])).then(() => undefined)
  }
}

export default CacheManager
