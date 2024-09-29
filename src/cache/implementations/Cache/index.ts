import type {Key, Cache as ICache, BaseCache} from '../../../types/cache.t'

import {CACHE_KEY} from '../../constants'

class Cache<K extends Key, T> implements ICache<K, T> {
  public [CACHE_KEY]: ICache<K, T> | BaseCache<K, T>

  constructor(cache?: ICache<K, T> | BaseCache<K, T>) {
    this[CACHE_KEY] = cache || new Map()
  }

  set(key: K, value: T) {
    this[CACHE_KEY].set(key, value)
    return this
  }

  get(key: K) {
    return this[CACHE_KEY].get(key)
  }

  has(key: K) {
    return this[CACHE_KEY].has(key)
  }

  delete(key: K) {
    return this[CACHE_KEY].delete(key)
  }

  // enumeration
  keys() {
    return this[CACHE_KEY].keys()
  }

  values() {
    return this[CACHE_KEY].values()
  }

  entries() {
    return this[CACHE_KEY].entries()
  }

  [Symbol.iterator]() {
    return this[CACHE_KEY][Symbol.iterator]()
  }

  clean() {
    if (typeof (this[CACHE_KEY] as ICache<K, T>).clean === 'function') {
      return (this[CACHE_KEY] as ICache<K, T>).clean()
    } else {
      for (const key of this.keys()) {
        this[CACHE_KEY].delete(key)
      }
    }
  }
}

export default Cache
