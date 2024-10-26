import type {
  Key,
  Cache as ICache,
  BaseCache,
  CacheEventMap,
  CacheEventMapKey
} from '../../../types/cache.t'
import type {
  EventEmitter,
  EventListener
} from '../../../types/eventEmitter.t'

import subscribe from '../../../commons/eventEmitter/subscribe'
import createEventEmitter from '../../../commons/eventEmitter/createEventEmitter'

import {CACHE_KEY, EVENT_EMITTER_KEY} from '../../constants'

class Cache<K extends Key, T> implements ICache<K, T> {
  public [CACHE_KEY]: ICache<K, T> | BaseCache<K, T>
  public [EVENT_EMITTER_KEY]: EventEmitter<CacheEventMap<K, T>>

  constructor (cache?: ICache<K, T> | BaseCache<K, T>) {
    this[CACHE_KEY] = cache || new Map()
    this[EVENT_EMITTER_KEY] = createEventEmitter<CacheEventMap<K, T>>()
  }

  set (key: K, value: T) {
    const result = this[CACHE_KEY].set(key, value)
    this[EVENT_EMITTER_KEY].emit('set', key, value)
    return result
  }

  get (key: K) {
    const result = this[CACHE_KEY].get(key)
    this[EVENT_EMITTER_KEY].emit('get', key)
    return result
  }

  has (key: K) {
    return this[CACHE_KEY].has(key)
  }

  delete (key: K) {
    const result = this[CACHE_KEY].delete(key)
    this[EVENT_EMITTER_KEY].emit('delete', key)
    return result
  }

  // enumeration
  keys () {
    return this[CACHE_KEY].keys()
  }

  values () {
    return this[CACHE_KEY].values()
  }

  entries () {
    return this[CACHE_KEY].entries()
  }

  on <M extends CacheEventMap<K, T> = CacheEventMap<K, T>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    return subscribe<M, EK>(this[EVENT_EMITTER_KEY], eventName, listener)
  }

  [Symbol.iterator] () {
    return this[CACHE_KEY][Symbol.iterator]()
  }

  clean () {
    if (typeof (this[CACHE_KEY] as ICache<K, T>).clean === 'function') {
      const result = (this[CACHE_KEY] as ICache<K, T>).clean()
      this[EVENT_EMITTER_KEY].emit('clean')
      return result
    } else {
      for (const key of this.keys()) {
        this[CACHE_KEY].delete(key)
      }
      this[EVENT_EMITTER_KEY].emit('clean')
    }
  }
}

export default Cache
