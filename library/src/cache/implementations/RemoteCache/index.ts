import type {
  Key,
  AbstractCache,
  AnyCache,
  CacheKey,
  CacheValue,
  CacheEventMap,
  CacheEventMapKey
} from '../../../types/cache.t'
import type {
  EventListener,
  EventEmitter
} from '../../../types/eventEmitter.t'

import evaluate from '../../../commons/evaluate'
import createEventEmitter from '../../../commons/eventEmitter/createEventEmitter'
import subscribe from '../../../commons/eventEmitter/subscribe'

import {CACHE_KEY, EVENT_EMITTER_KEY} from '../../constants'
import forEach from '../../../commons/iterators/forEach'

import {
  REMOTE_CACHE_KEY,
  OPTIONS_KEY,
  CleanupPolicies,
  type SourceOptions
} from './constants'

const defaultOptions: SourceOptions = {
  deleteFromSource: true,
  cleanupPolicy: CleanupPolicies.ALL
}

const getFrontCache = <C extends RemoteCache<any, any>>(cache: C) => {
  return cache[CACHE_KEY]
}

const getRemoteCache = <C extends RemoteCache<any, any>>(cache: C) => {
  return cache[REMOTE_CACHE_KEY]
}

const introduce = <C extends RemoteCache<any, any>>(cache: C, key: Key, value: any) => {
  return cache[CACHE_KEY].set(key, value)
}

const cleanKeys = <C extends AnyCache<any, any>>(cache: C, keysIterator: IterableIterator<CacheKey<C>> | AsyncIterableIterator<CacheKey<C>>) => {
  return forEach(keysIterator, (key) => {
    return cache.delete(key)
  })
}

const clean = <C extends AnyCache<any, any>>(cache: C) => {
  if (typeof (cache as AbstractCache<CacheKey<C>, CacheValue<C>>).clean === 'function') {
    return (cache as AbstractCache<CacheKey<C>, CacheValue<C>>).clean()
  }

  return cleanKeys(cache, cache.keys())
}

const cleanRemoteCache = <C extends RemoteCache<any, any>>(cache: C) => {
  if (cache[OPTIONS_KEY].deleteFromSource) {
    if (cache[OPTIONS_KEY].cleanupPolicy === CleanupPolicies.ALL) {
      return clean(getRemoteCache(cache))
    }
    if (cache[OPTIONS_KEY].cleanupPolicy === CleanupPolicies.KEYS) {
      return cleanKeys(getRemoteCache(cache), getFrontCache(cache).keys())
    }
  }

  return undefined
}

class RemoteCache<K extends Key, T> implements AbstractCache<K, T> {
  public [CACHE_KEY]: AnyCache<K, T>
  public [REMOTE_CACHE_KEY]: AnyCache<K, T>
  public [OPTIONS_KEY]: SourceOptions
  public [EVENT_EMITTER_KEY]: EventEmitter<CacheEventMap<K, T>>

  constructor (frontCache: AnyCache<K, T>, remoteCache: AnyCache<K, T>, options?: Partial<SourceOptions>) {
    this[CACHE_KEY] = frontCache
    this[REMOTE_CACHE_KEY] = remoteCache
    this[OPTIONS_KEY] = {...defaultOptions, ...options}
    this[EVENT_EMITTER_KEY] = createEventEmitter<CacheEventMap<K, T>>()
  }

  get (key: K) {
    return evaluate(getFrontCache(this).get(key), (value) => {
      // specifically undefined
      if (value === undefined) {
        return evaluate(getRemoteCache(this).get(key), (value) => {
          return evaluate(introduce(this, key, value), () => {
            this[EVENT_EMITTER_KEY].emit('get', key)
            return value
          })
        })
      }

      this[EVENT_EMITTER_KEY].emit('get', key)
      return value
    })
  }

  set (key: K, value: T) {
    return evaluate(getFrontCache(this).set(key, value), () => {
      return evaluate(getRemoteCache(this).set(key, value), (result) => {
        this[EVENT_EMITTER_KEY].emit('set', key, value)
        return result
      })
    })
  }

  has (key: K) {
    return evaluate(getFrontCache(this).has(key), (isExist) => isExist || getRemoteCache(this).has(key))
  }

  delete (key: K) {
    return evaluate(getFrontCache(this).delete(key), (result) => {
      return evaluate(this[OPTIONS_KEY].deleteFromSource ? getRemoteCache(this).delete(key) : result, (result) => {
        this[EVENT_EMITTER_KEY].emit('delete', key)
        return result
      })
    })
  }

  keys () {
    return this[REMOTE_CACHE_KEY].keys()
  }

  values () {
    return this[REMOTE_CACHE_KEY].values()
  }

  entries () {
    return this[REMOTE_CACHE_KEY].entries()
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  clean () {
    return evaluate(cleanRemoteCache(this), () => {
      return evaluate(clean(getFrontCache(this)), () => {
        this[EVENT_EMITTER_KEY].emit('clean')
      })
    })
  }

  on <M extends CacheEventMap<K, T> = CacheEventMap<K, T>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    // return getFrontCache(this).on(eventName, listener)
    return subscribe<M, EK>(this[EVENT_EMITTER_KEY], eventName, listener)
  }
}

export default RemoteCache
