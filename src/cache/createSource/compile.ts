import promisify from '../../commons/promise/promisify'
import getAsyncIterator from '../../commons/iterators/getAsyncIterator'
import once from '../../commons/once'

import type {AsyncCache, Key} from '../../types/cache.t'
import type {SourceOptions} from './constants'
import Cache from '../implementations/Cache'

const createCache = <K extends Key, T>() => new Cache<K, T>()

const compile = <K extends Key, T>(options: SourceOptions<K, T>) => {
  // We're taking advantage of the fact that it will be the same reference in order to create this cache only when needed
  const getCache = once<typeof createCache<K, T>>(createCache)

  const get = (key: K) => {
    return promisify(options.get(key)).then((value) => {
      if (value && !getCache().has(key)) {
        getCache().set(key, value);
      }
      return value
    })
  }

  const set = options.set ? (key: K, value: T) => {
    getCache().set(key, value)
    return promisify((options.set as AsyncCache<K, T>['set'])(key, value))
  } : (key: K, value: T) => {
    getCache().set(key, value)
    return Promise.resolve()
  }

  const has = options.has ? (key: K) => {
    return promisify((options.has as AsyncCache<K, T>['has'])(key))
  } : (key: K) => {
    return Promise.resolve(getCache().has(key))
  }

  const deleteItem = options.delete ? (key: K) => {
    getCache().delete(key)
    return promisify((options.delete as AsyncCache<K, T>['delete'])(key))
  } : (key: K) => {
    getCache().delete(key)
    return Promise.resolve()
  }

  const clean = options.clean ? (() => {
    getCache().clean()
    return promisify((options.clean as AsyncCache<K, T>['clean'])())
  }) : () => {
    getCache().clean()
    return Promise.resolve()
  }

  const keys = options.keys ? (() => getAsyncIterator((options.keys as AsyncCache<K, T>['keys'])())) : () => {
    return getAsyncIterator(getCache().keys())
  }

  const values = options.values ? (() => getAsyncIterator((options.values as AsyncCache<K, T>['values'])())) : () => {
    return getAsyncIterator(getCache().values())
  }
  
  const entries = options.entries ? (() => getAsyncIterator((options.entries as AsyncCache<K, T>['entries'])())) : () => {
    return getAsyncIterator(getCache().entries())
  }

  return {
    get,
    set,
    has,
    delete: deleteItem,
    clean,
    keys,
    values,
    entries
  }
}

export default compile
