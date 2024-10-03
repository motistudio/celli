import evaluate from '../../../commons/evaluate'

import type {
  Key,
  AbstractCache,
  AnyCache,
  CacheKey,
  CacheValue
} from '../../../types/cache.t'

import {CACHE_KEY} from '../../constants'
import forEach from '../../../commons/iterators/forEach'

import {
  BACKUP_CACHE_KEY,
  OPTIONS_KEY,
  CleanupPolicies,
  type SourceOptions
} from './constants'

const defaultOptions: SourceOptions = {
  deleteFromSource: true,
  cleanupPolicy: CleanupPolicies.ALL
}

const getFrontCache = <C extends BackupCache<any, any>>(cache: C) => {
  return cache[CACHE_KEY]
}

const getBackupCache = <C extends BackupCache<any, any>>(cache: C) => {
  return cache[BACKUP_CACHE_KEY]
}

const introduce = <C extends BackupCache<any, any>>(cache: C, key: Key, value: any) => {
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

const cleanBackupCache = <C extends BackupCache<any, any>>(cache: C) => {
  if (cache[OPTIONS_KEY].deleteFromSource) {
    if (cache[OPTIONS_KEY].cleanupPolicy === CleanupPolicies.ALL) {
      return clean(getBackupCache(cache))
    }
    if (cache[OPTIONS_KEY].cleanupPolicy === CleanupPolicies.KEYS) {
      return cleanKeys(getBackupCache(cache), getFrontCache(cache).keys())
    }
  }

  return undefined
}

class BackupCache<K extends Key, T> implements AbstractCache<K, T> {
  public [CACHE_KEY]: AnyCache<K, T>
  public [BACKUP_CACHE_KEY]: AnyCache<K, T>
  public [OPTIONS_KEY]: SourceOptions

  constructor (frontCache: AnyCache<K, T>, backupCache: AnyCache<K, T>, options?: Partial<SourceOptions>) {
    this[CACHE_KEY] = frontCache
    this[BACKUP_CACHE_KEY] = backupCache
    this[OPTIONS_KEY] = {...defaultOptions, ...options}
  }

  get (key: K) {
    return evaluate(getFrontCache(this).get(key), (value) => {
      // specifically undefined
      if (value === undefined) {
        return evaluate(getBackupCache(this).get(key), (value) => {
          return evaluate(introduce(this, key, value), () => value)
        })
      }
      return value
    })
  }

  set (key: K, value: T) {
    return evaluate(getFrontCache(this).set(key, value), () => getBackupCache(this).set(key, value))
  }

  has (key: K) {
    return evaluate(getFrontCache(this).has(key), (isExist) => isExist || getBackupCache(this).has(key))
  }

  delete (key: K) {
    return evaluate(getFrontCache(this).delete(key), (result) => {
      if (this[OPTIONS_KEY].deleteFromSource) {
        return getBackupCache(this).delete(key)
      }
      return result
    })
  }

  keys () {
    return this[BACKUP_CACHE_KEY].keys()
  }

  values () {
    return this[BACKUP_CACHE_KEY].values()
  }

  entries () {
    return this[BACKUP_CACHE_KEY].entries()
  }

  [Symbol.iterator] () {
    return this.entries()
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  clean () {
    return evaluate(cleanBackupCache(this), () => clean(getFrontCache(this)))
  }
}

export default BackupCache
