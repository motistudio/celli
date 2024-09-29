import type {
  Key,
  AbstractCache as IAbstractCache,
  CacheValue,
  AsyncInnerCache,
  AsyncCache,
  Cache
} from '../../../types/cache.t'
import type {Effect} from '../../../types/effects.t'
import isThentable from '../../../commons/promise/isThentable'

import {CACHE_KEY, DELETE_PROMISES_KEY} from '../../constants'
import {CLEANUP_QUEUE, DELETE_QUEUE, LIFECYCLE_ITEMS_KEY} from './constants'
import LifeCycleItem from './LifeCycleItem'

const DEFAULT_EFFECTS: Effect<any>[] = []

const clean = <C extends LifeCycleCache<any, any>>(cache: C, cleanupPromise: Promise<void>) => {
  const cleanup = Promise.resolve(cleanupPromise).then(() => {
    cache[CLEANUP_QUEUE].delete(cleanup)
  })
  cache[CLEANUP_QUEUE].add(cleanup)
  return cleanup
}

const cleanByKey = <C extends LifeCycleCache<any, any>>(cache: C, key: Key): Promise<void> | void => {
  const lifeCycleItem = cache[LIFECYCLE_ITEMS_KEY].get(key)
  if (lifeCycleItem) {
    const result = lifeCycleItem.clean()
    cache[LIFECYCLE_ITEMS_KEY].delete(key)
    return result
  }
  return undefined
}

const setLifeCycleItem = <C extends LifeCycleCache<any, any>>(cache: C, key: Key, initialValue: any, effects: Effect<any>[]) => {
  const cleanPromise = cleanByKey(cache, key)
  if (cleanPromise) {
    clean(cache, cleanPromise)
  }
  const lifeCycleItem = new LifeCycleItem(effects, initialValue, (value) => cache[CACHE_KEY].set(key, value), () => cache.delete(key))
  cache[LIFECYCLE_ITEMS_KEY].set(key, lifeCycleItem)
}

class LifeCycleCache<K extends Key, T> implements IAbstractCache<K, T> {
  public [CACHE_KEY]: AsyncInnerCache<K, T>
  public [CLEANUP_QUEUE]: Set<Promise<void>>
  public [DELETE_QUEUE]: Set<Promise<void>>
  public [LIFECYCLE_ITEMS_KEY]: Map<K, LifeCycleItem<T>>
  public [DELETE_PROMISES_KEY]: Map<K, Promise<void>>

  constructor (cache?: AsyncInnerCache<K, T>) {
    this[CACHE_KEY] = cache || new Map()
    this[LIFECYCLE_ITEMS_KEY] = new Map()
    this[CLEANUP_QUEUE] = new Set()
    this[DELETE_QUEUE] = new Set()

    this[DELETE_PROMISES_KEY] = new Map()
  }

  get (key: K) {
    const lifeCycleItem = this[LIFECYCLE_ITEMS_KEY].get(key)
    const result = this[CACHE_KEY].get(key)
    if (isThentable(result)) {
      return result.then((value) => {
        if (lifeCycleItem && value) {
          lifeCycleItem.read(value)
        }
        return value
      })
    }

    if (lifeCycleItem && result) {
      lifeCycleItem.read(result)
    }
    return result
  }

  set (key: K, value: T, effects?: Effect<T>[]) {
    const result = this[CACHE_KEY].set(key, value)
    if (isThentable(result)) {
      return result.then((result) => {
        setLifeCycleItem(this, key, result, effects || DEFAULT_EFFECTS)
        this[DELETE_PROMISES_KEY].delete(key)
        return result
      })
    }

    setLifeCycleItem(this, key, value, effects || DEFAULT_EFFECTS)
    this[DELETE_PROMISES_KEY].delete(key)
    return result
  }

  has (key: K) {
    return this[CACHE_KEY].has(key)
  }

  delete (key: K) {
    const existingDeletePromise = this[DELETE_PROMISES_KEY].get(key)
    if (existingDeletePromise) {
      return existingDeletePromise
    }

    const result = this[CACHE_KEY].delete(key)
    if (isThentable(result)) {
      const deletePromise = result.then((val) => {
        const cleanupPromise = cleanByKey(this, key)
        if (cleanupPromise) {
          clean(this, cleanupPromise)
        }

        this[DELETE_QUEUE].delete(deletePromise)
        if (this[DELETE_PROMISES_KEY].get(key) === deletePromise) {
          this[DELETE_PROMISES_KEY].delete(key)
        }
        return val
      })

      this[DELETE_QUEUE].add(deletePromise)
      this[DELETE_PROMISES_KEY].set(key, deletePromise)

      return deletePromise
    }

    const cleanupPromise = cleanByKey(this, key)
    if (cleanupPromise) {
      clean(this, cleanupPromise)
    }
    return result
  }

  keys () {
    return this[CACHE_KEY].keys()
  }

  values () {
    return this[CACHE_KEY].values()
  }

  // async * values () {
  //   for await (const item of this[cacheKey].values()) {
  //     // trigger read
  //     yield item.value
  //   } 
  // }

  entries () {
    return this[CACHE_KEY].entries()
  }
  // async * entries () {
  //   for await (const [key, item] of this[cacheKey].entries()) {
  //     // trigger read
  //     yield [key, item.value] as [K, T]
  //   }
  // }

  [Symbol.iterator] () {
    return this.entries()
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  clean () {
    const hasClean = typeof (this[CACHE_KEY] as AsyncCache<K, T>).clean === 'function'
    const cleanPromise = hasClean ? (this[CACHE_KEY] as AsyncCache<K, T>).clean() : undefined

    Array.from(this[LIFECYCLE_ITEMS_KEY].keys()).forEach((key) => this.delete(key))

    // Otherwise it's necessarily sync-based cache
    if (cleanPromise || this[DELETE_QUEUE].size > 0) {
      return Promise.all([cleanPromise, ...this[DELETE_QUEUE]].filter(Boolean)).then(() => {
        return Promise.all(this[CLEANUP_QUEUE])
      }).then(() => undefined)
    }

    return undefined
  }
}

export default LifeCycleCache
