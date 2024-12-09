import type {Cleanable, CacheManager as ICacheManager, ClearListener} from '../types/cacheManager.t'
import type {Unsubscribe} from '../types/eventEmitter.t'

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

type Ref = any

class CacheManager<T extends Cleanable> implements ICacheManager<T> {
  public collection: Set<T>
  public namedCollection: Map<Ref, T>
  public collectionNames: Map<T, Ref>
  public clearListeners: ClearListener[]

  constructor () {
    this.collection = new Set()
    this.namedCollection = new Map()
    this.collectionNames = new Map()
    this.clearListeners = []

    this.clean = singlify(this.clean.bind(this))
    this.clear = singlify(this.clear.bind(this))
    this.register = this.register.bind(this)
    this.unregister = this.unregister.bind(this)
    this.getByRef = this.getByRef.bind(this)
    this.onClear = this.onClear.bind(this)
  }

  getByRef (ref: string): T | undefined {
    return this.namedCollection.get(ref)
  }

  register (cache: T, ref?: string) {
    if (!this.collection.has(cache)) {
      // Updating the ref count
      cacheManagerRefCount.set(cache, getCacheRefCount(cache) + 1)

      this.collection.add(cache)
      if (ref) {
        this.namedCollection.set(ref, cache)
        this.collectionNames.set(cache, ref)
      }
    }
  }

  unregister (cache: T) {
    unregisterByRef(this, cache)

    // Removes named pair
    const ref = this.collectionNames.get(cache)
    if (ref) {
      this.namedCollection.delete(ref)
      this.collectionNames.delete(cache)
    }
  }

  onClear (fn: ClearListener): Unsubscribe {
    this.clearListeners.push(fn)
    return () => {
      this.clearListeners.splice(this.clearListeners.indexOf(fn), 1)
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
      // Activate all events
      this.clearListeners.forEach(fn => fn())
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
