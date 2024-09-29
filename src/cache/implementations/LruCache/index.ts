import getAsyncIterator from '../../../commons/iterators/getAsyncIterator'
import isThentable from '../../../commons/promise/isThentable'

import type {
  Key,
  Cache as ICache,
  AsyncCache as IAsyncCache,
  AbstractCache,
  AsyncInnerCache
} from '../../../types/cache.t'

import {CACHE_KEY} from '../../constants'

import type {ItemSizeGetter, LruCacheOptions} from './types.t'

const KEYS_CACHE_KEY = Symbol.for('keys-cache')

const DEFAULT_MAX_CACHE_SIZE = 500

const defaultItemSizeGetter = () => 1 // representing an item's own size - when the size represents the amount of items

const DEFAULT_OPTIONS: LruCacheOptions<Key, any> = {
  maxSize: DEFAULT_MAX_CACHE_SIZE,
  getItemSize: defaultItemSizeGetter
}

/**
 * Returns an existing key's size.
 * If the key does not exist - it will return 0
 * @param {LruCache<Key, any>} cache - Any LruCache
 * @param {Key} key - Any key 
 * @returns {number} the item's size
 */
const getKeySize = <C extends LruCache<any, any>>(cache: C, key: Key): number => {
  return cache[KEYS_CACHE_KEY].has(key) ? (cache[KEYS_CACHE_KEY].get(key) || 1) : 0
}

/**
 * Util function: refreshes a give key of an LruCache
 * @param {LruCache<Key, any>} cache - Any LruCache
 * @param {Key} key - Any key 
 */
const refreshKey = <C extends LruCache<any, any>>(cache: C, key: Key) => {
  if (cache[KEYS_CACHE_KEY].has(key)) {
    const existingSize = cache[KEYS_CACHE_KEY].get(key)
    cache[KEYS_CACHE_KEY].delete(key)
    cache[KEYS_CACHE_KEY].set(key, existingSize)
  }
}

/**
 * Sets a new key.
 * It might cause delete calls as side-effect
 * @param {LruCache<Key, any>} cache - Any LruCache
 * @param {Key} key - Any key 
 * @param {number} size - The size the item takes 
 */
const setKey = <C extends LruCache<any, any>>(cache: C, key: Key, size: number) => {
  if (size < 1) {
    throw new Error('LruCacheError: Size cannot be smaller than 1')
  }
  if (size > cache.maxCacheSize) {
    throw new Error('LruCacheError: Item is bigger than the whole cache size')
  }

  const existingItemSize: number = getKeySize(cache, key)
  const expectedSizeDiff = size - existingItemSize

  // if the key exists with the same size then we only need to refresh it
  if (existingItemSize === size) {
    refreshKey(cache, key)
  } else { // if not then we should clear some room
    // Removing last key
    let currentExpectedSize = cache.usedSize + expectedSizeDiff // what the size will potentially be
    while (currentExpectedSize > cache.maxCacheSize) {
      // Deletes the last key
      cache.delete(cache[KEYS_CACHE_KEY].keys().next().value)
      currentExpectedSize = cache.usedSize + expectedSizeDiff // recalculate what the size will potentially be
    }

    cache[KEYS_CACHE_KEY].set(key, size === 1 ? undefined : size)
    cache.usedSize = cache.usedSize + expectedSizeDiff
  }
}

/**
 * Removes a key
 * @param {LruCache<Key, any>} cache - Any LruCache
 * @param {Key} key - Any key 
 */
const removeKey = <C extends LruCache<any, any>>(cache: C, key: Key) => {
  const existingSize = cache[KEYS_CACHE_KEY].has(key) ? (cache[KEYS_CACHE_KEY].get(key) || 1) : 0
  cache[KEYS_CACHE_KEY].delete(key)
  cache.usedSize = cache.usedSize - existingSize
}

const introduce = <C extends LruCache<any, any>>(cache: C, key: Key, item?: any) => {
  if (item !== undefined && !cache[KEYS_CACHE_KEY].has(key)) {
    setKey(cache, key, cache.getItemSize(key, item))
  } else {
    refreshKey(cache, key)
  }
}

/**
 * An LRU Cache implementation
 * @todo Customize the basic key setters/getters, since they might be async as well
 */
class LruCache<K extends Key, T> implements AbstractCache<K, T> {
  public [CACHE_KEY]: AsyncInnerCache<K, T>
  public [KEYS_CACHE_KEY]: Map<K, number | undefined> // we treat 1's as undefined to save space
  public maxCacheSize: number
  public usedSize: number
  public getItemSize: ItemSizeGetter<K, T>

  constructor (cache?: AsyncInnerCache<K, T>, options?: Partial<LruCacheOptions<K, T>>) {
    this[CACHE_KEY] = cache || new Map()
    this[KEYS_CACHE_KEY] = new Map()
    this.usedSize = 0

    const computedOptions = {...(DEFAULT_OPTIONS as LruCacheOptions<K, T>), ...options} as LruCacheOptions<K, T>
    this.maxCacheSize = computedOptions.maxSize
    this.getItemSize = computedOptions.getItemSize
  }

  get (key: K) {
    const item = this[CACHE_KEY].get(key)
    if (isThentable(item)) {
      return item.then((item) => {
        introduce(this, key, item)
        return item
      })
    }

    introduce(this, key, item)
    return item
  }

  set (key: K, value: T) {
    const result = this[CACHE_KEY].set(key, value)
    if (isThentable(result)) {
      return result.then((result) => {
        setKey(this, key, this.getItemSize(key, value))
        return result
      })
    }

    setKey(this, key, this.getItemSize(key, value))
    return result
  }

  has (key: K) {
    return this[CACHE_KEY].has(key)
  }

  delete (key: K) {
    removeKey(this, key)
    return this[CACHE_KEY].delete(key)
  }

  keys () {
    return this[CACHE_KEY].keys()
  }

  values () {
    return this[CACHE_KEY].values()
  }

  entries () {
    return this[CACHE_KEY].entries()
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  [Symbol.asyncIterator] () {
    return getAsyncIterator(this.entries())
  }

  clean () {
    if (typeof (this[CACHE_KEY] as (ICache<K, T> | IAsyncCache<K, T>)).clean === 'function') {
      const result = (this[CACHE_KEY] as (ICache<K, T> | IAsyncCache<K, T>)).clean()
      if (isThentable(result)) {
        return result.then(() => {
          this[KEYS_CACHE_KEY] = new Map()
          this.usedSize = 0
        })
      }
      this[KEYS_CACHE_KEY] = new Map()
      this.usedSize = 0
      return undefined
    }

    // Assuming 'clean' is not exist - it means we're running on a simple synchronous cache.
    // Therefor, we can use the KEYS_CACHE_KEY instead of reading all the keys
    const keys = Array.from(this[KEYS_CACHE_KEY].keys())
    keys.forEach((key) => this.delete(key))

    return undefined
  }
}

export default LruCache
