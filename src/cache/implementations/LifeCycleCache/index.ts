import type {
  Key,
  CacheKey,
  CacheValue,
  AsyncInnerCache,
  AsyncCache,
  AnyCacheType
} from '../../../types/cache.t'
import type {Effect} from '../../../types/effects.t'
import isThentable from '../../../commons/promise/isThentable'

import {CACHE_KEY, DELETE_PROMISES_KEY} from '../../constants'
import {CLEANUP_QUEUE, DELETE_QUEUE, LIFECYCLE_ITEMS_KEY, type LifeCycleCache as ILifeCycleCache} from './constants'
import LifeCycleItem from './LifeCycleItem'
import RemoteApi from './RemoteApi'

const DEFAULT_EFFECTS: Effect<any>[] = []

/**
 * Adds a promise to the clean queue
 * @template C extends LifeCycleCache<AnyCacheType<any, any>>
 * @param {C} cache - LifeCycleCache reference 
 * @param {Promise<void>} cleanupPromise - any promsise
 * @returns {Promise<void>} A promise that will be resolved after the cleanup has been deleted
 */
const clean = <C extends LifeCycleCache<AnyCacheType<any, any>>>(cache: C, cleanupPromise: Promise<void>) => {
  const cleanup = Promise.resolve(cleanupPromise).then(() => {
    cache[CLEANUP_QUEUE].delete(cleanup)
  })
  cache[CLEANUP_QUEUE].add(cleanup)
  return cleanup
}

/**
 * Cleans a key (effects) if exists
 * @template C extends LifeCycleCache<AnyCacheType<any, any>>
 * @param {C} cache - LifeCycleCache reference 
 * @param {CacheKey<C>} key - A key to clean
 * @returns {Promise<void> | undefined} A promise if the cleanup returns one
 */
const cleanByKey = <C extends LifeCycleCache<AnyCacheType<any, any>>>(cache: C, key: Key): Promise<void> | void => {
  const lifeCycleItem = cache[LIFECYCLE_ITEMS_KEY].get(key)
  if (lifeCycleItem) {
    const result = lifeCycleItem.clean()
    cache[LIFECYCLE_ITEMS_KEY].delete(key)
    return result
  }
  return undefined
}

/**
 * Sets a lifecycle item into the cache
 * @template C extends LifeCycleCache<AnyCacheType<any, any>>
 * @param {C} cache - LifeCycleCache reference
 * @param {CacheKey<C>} key - A key to clean
 * @param {CacheValue<C>} initialValue - The item's initial value 
 * @param {Effect<CacheValue<C>>[]} effects - An array of effects 
 */
const setLifeCycleItem = <C extends LifeCycleCache<AnyCacheType<any, any>>>(cache: C, key: Key, initialValue: any, effects: Effect<any>[]) => {
  const cleanPromise = cleanByKey(cache, key)
  if (cleanPromise) {
    clean(cache, cleanPromise)
  }
  const lifeCycleItem = new LifeCycleItem(effects, new RemoteApi(cache, key as CacheKey<C>, initialValue))
  cache[LIFECYCLE_ITEMS_KEY].set(key, lifeCycleItem)
}

/**
 * LifeCycle Cache
 * This cache accepts an array of effects, which will be called upon setting an item (if successful)
 */
class LifeCycleCache<C extends AnyCacheType<any, any>> implements ILifeCycleCache<C> {
  public [CACHE_KEY]: AsyncInnerCache<CacheKey<C>, CacheValue<C>>
  public [CLEANUP_QUEUE]: Set<Promise<void>>
  public [DELETE_QUEUE]: Set<Promise<void>>
  public [LIFECYCLE_ITEMS_KEY]: Map<CacheKey<C>, LifeCycleItem<CacheValue<C>>>
  public [DELETE_PROMISES_KEY]: Map<CacheKey<C>, Promise<void>>

  constructor (cache?: C) {
    this[CACHE_KEY] = cache || new Map()
    this[LIFECYCLE_ITEMS_KEY] = new Map()
    this[CLEANUP_QUEUE] = new Set()
    this[DELETE_QUEUE] = new Set()

    this[DELETE_PROMISES_KEY] = new Map()
  }

  get (...args: Parameters<C['get']>) {
    const lifeCycleItem = this[LIFECYCLE_ITEMS_KEY].get.apply(this[LIFECYCLE_ITEMS_KEY], args)
    const result = this[CACHE_KEY].get.apply(this[CACHE_KEY], args)
    if (isThentable(result)) {
      return result.then((value) => {
        if (lifeCycleItem && value) {
          lifeCycleItem.read(value)
        }
        return value
      }) as ReturnType<C['get']>
    }

    if (lifeCycleItem && result) {
      lifeCycleItem.read(result)
    }
    return result as ReturnType<C['get']>
  }

  set (key: CacheKey<C>, value: CacheValue<C>, effects?: Effect<CacheValue<C>>[]) {
    const result = this[CACHE_KEY].set(key, value)
    if (isThentable(result)) {
      return result.then((result) => {
        setLifeCycleItem(this, key, value, effects || DEFAULT_EFFECTS)
        this[DELETE_PROMISES_KEY].delete(key)
        return result
      }) as ReturnType<C['set']>
    }

    setLifeCycleItem(this, key, value, effects || DEFAULT_EFFECTS)
    this[DELETE_PROMISES_KEY].delete(key)
    return result as ReturnType<C['set']>
  }

  has (...args: Parameters<C['has']>) {
    return this[CACHE_KEY].has.apply(this[CACHE_KEY], args) as ReturnType<C['has']>
  }

  delete (key: CacheKey<C>) {
    const existingDeletePromise = this[DELETE_PROMISES_KEY].get(key)
    if (existingDeletePromise) {
      return existingDeletePromise as ReturnType<C['delete']>
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

      return deletePromise  as ReturnType<C['delete']>
    }

    const cleanupPromise = cleanByKey(this, key)
    if (cleanupPromise) {
      clean(this, cleanupPromise)
    }
    return result as ReturnType<C['delete']>
  }

  keys () {
    return this[CACHE_KEY].keys() as ReturnType<C['keys']>
  }

  values () {
    return this[CACHE_KEY].values() as ReturnType<C['values']>
  }

  entries () {
    return this[CACHE_KEY].entries() as ReturnType<C['entries']>
  }

  [Symbol.iterator] () {
    return this.entries() as IterableIterator<[CacheKey<C>, CacheValue<C>]>
  }

  [Symbol.asyncIterator] () {
    return this.entries() as AsyncIterableIterator<[CacheKey<C>, CacheValue<C>]>
  }

  clean () {
    const hasClean = typeof (this[CACHE_KEY] as AsyncCache<CacheKey<C>, CacheValue<C>>).clean === 'function'
    const cleanPromise = hasClean ? (this[CACHE_KEY] as AsyncCache<CacheKey<C>, CacheValue<C>>).clean() : undefined

    Array.from(this[LIFECYCLE_ITEMS_KEY].keys()).forEach((key) => this.delete(key))

    // Otherwise it's necessarily sync-based cache
    if (cleanPromise || this[DELETE_QUEUE].size > 0) {
      return Promise.all([cleanPromise, ...this[DELETE_QUEUE]].filter(Boolean)).then(() => {
        return Promise.all(this[CLEANUP_QUEUE])
      }).then(() => undefined) as ReturnType<C['clean']>
    }

    return undefined as ReturnType<C['clean']>
  }
}

export default LifeCycleCache
