import type {
  Key,
  Cache as ICache,
  AnyCacheType,
  CacheKey,
  CacheValue,
  LruCache as ILruCache,
  CacheEventMap,
  CacheEventMapKey
} from '../../../types/cache.t'
import {EventListener} from '../../../types/eventEmitter.t'

import getAsyncIterator from '../../../commons/iterators/getAsyncIterator'
import isThentable from '../../../commons/promise/isThentable'

import Cache from '../Cache'

import {CACHE_KEY, EVENT_EMITTER_KEY} from '../../constants'

import type {LruItemSizeGetter, LruCacheOptions} from '../../../types/functional.t'
import evaluate from '../../../commons/evaluate'

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
const getKeySize = <C extends LruCache<AnyCacheType<any, any>>>(cache: C, key: Key): number => {
  return cache[KEYS_CACHE_KEY].has(key) ? (cache[KEYS_CACHE_KEY].get(key) || 1) : 0
}

/**
 * Util function: refreshes a give key of an LruCache
 * @param {LruCache<Key, any>} cache - Any LruCache
 * @param {Key} key - Any key 
 */
const refreshKey = <C extends LruCache<AnyCacheType<any, any>>>(cache: C, key: Key) => {
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
const setKey = <C extends LruCache<AnyCacheType<any, any>>>(cache: C, key: Key, size: number) => {
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
const removeKey = <C extends LruCache<AnyCacheType<any, any>>>(cache: C, key: Key) => {
  const existingSize = cache[KEYS_CACHE_KEY].has(key) ? (cache[KEYS_CACHE_KEY].get(key) || 1) : 0
  cache[KEYS_CACHE_KEY].delete(key)
  cache.usedSize = cache.usedSize - existingSize
}

const introduce = <C extends LruCache<AnyCacheType<any, any>>>(cache: C, key: Key, item?: any) => {
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
class LruCache<C extends AnyCacheType<any, any> = ICache<any, any>> implements ILruCache<C> {
  public [CACHE_KEY]: C
  public [KEYS_CACHE_KEY]: Map<CacheKey<C>, number | undefined> // we treat 1's as undefined to save space
  public maxCacheSize: number
  public usedSize: number
  public getItemSize: LruItemSizeGetter<CacheKey<C>, CacheValue<C>>

  constructor (cache?: C, options?: Partial<LruCacheOptions<CacheKey<C>, CacheValue<C>>>) {
    this[CACHE_KEY] = cache || (new Cache<CacheKey<C>, CacheValue<C>>() as unknown as C)
    this[KEYS_CACHE_KEY] = new Map()
    this.usedSize = 0

    const computedOptions = {...(DEFAULT_OPTIONS as LruCacheOptions<CacheKey<C>, CacheValue<C>>), ...options} as LruCacheOptions<CacheKey<C>, CacheValue<C>>
    this.maxCacheSize = computedOptions.maxSize
    this.getItemSize = computedOptions.getItemSize

    // This is done anyways when delete() is called,
    // but sometimes events would come up from the cache we wrap with no call through this API
    this.on('delete', (key) => {
      if (this[KEYS_CACHE_KEY].has(key)) {
        removeKey(this, key)
      }
    })

    this.on('clean', () => {
      // Resets again if needed - in case the event came from the wrapped cache
      if (this[KEYS_CACHE_KEY].size > 0) {
        this[KEYS_CACHE_KEY] = new Map()
      }
    })
  }

  get (...args: Parameters<C['get']>) {
    const key = args[0]
    return evaluate(this[CACHE_KEY].get.apply(this[CACHE_KEY], args), (item) => {
      introduce(this, key, item)
      return item
    })
  }

  set (...args: Parameters<C['set']>): ReturnType<C['set']> {
    const [key, value] = args as [key: CacheKey<C>, value: CacheValue<C>]
    return evaluate(this[CACHE_KEY].set.apply(this[CACHE_KEY], args), (result) => {
      setKey(this, key, this.getItemSize(key, value))
      return result
    }) as ReturnType<C['set']>
  }

  has (...args: Parameters<C['has']>) {
    return this[CACHE_KEY].has.apply(this[CACHE_KEY], args) as ReturnType<C['has']>
  }

  delete (...args: Parameters<C['delete']>) {
    // Removing the metadata first is basically assuming this operation will always work.
    // This comes from hypothesis that we shouldn't ever fail a set() operation if a delete() had failed.
    // Since set() requires the removal of keys (cause of lru), we should "always succeeed" to delete. At least the metadata.
    removeKey(this, args[0])
    return evaluate(this[CACHE_KEY].delete.apply(this[CACHE_KEY], args), (result) => {
      return result
    }) as ReturnType<C['delete']>
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
    return this.entries()
  }

  [Symbol.asyncIterator] () {
    return getAsyncIterator(this.entries())
  }

  clean () {
    return evaluate(this[CACHE_KEY].clean(), () => {
      this[KEYS_CACHE_KEY] = new Map()
      this.usedSize = 0
      return undefined
    }) as ReturnType<C['clean']>
  }

  on <M extends CacheEventMap<CacheKey<C>, CacheValue<C>> = CacheEventMap<CacheKey<C>, CacheValue<C>>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    return this[CACHE_KEY].on(eventName, listener)
  }
}

export default LruCache
