import type {
  Key,
  Cache as ICache,
  AsyncCache as IAsyncCache,
  AbstractCache as IAbstractCache,
  BaseCache,
  CacheEventMap,
  CacheEventMapKey
} from '../../../types/cache.t'
import type {
  EventEmitter,
  EventListener
} from '../../../types/eventEmitter.t'

import getAsyncIterator from '../../../commons/iterators/getAsyncIterator'
import createEventEmitter from '../../../commons/eventEmitter/createEventEmitter'
import subscribe from '../../../commons/eventEmitter/subscribe'

import {
  CACHE_KEY,
  GET_PROMISES_KEY,
  SET_PROMISES_KEY,
  HAS_PROMISES_KEY,
  DELETE_PROMISES_KEY,
  EVENT_EMITTER_KEY
} from '../../constants'
import Cache from '../Cache'
import promisify from '../../../commons/promise/promisify'

type SupportedInnerCache<K extends Key, T> = ICache<K, T> | IAsyncCache<K, T> | IAbstractCache<K, T> | BaseCache<K, T>

const getValuePromise = <K extends Key, T>(cache: AsyncCache<K, T>, key: K): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    const result = cache[CACHE_KEY].get(key)
    return Promise.resolve(result).then((result) => {
      cache[EVENT_EMITTER_KEY].emit('get', key)
      cache[GET_PROMISES_KEY].delete(key)
      return result
    }).then(resolve).catch((e) => {
      cache[GET_PROMISES_KEY].delete(key)
      reject(e)
    })
  })
}

class AsyncCache<K extends Key, T> implements IAsyncCache<K, T> {
  public [CACHE_KEY]: SupportedInnerCache<K, T>
  public [GET_PROMISES_KEY]: Map<K, Promise<T | undefined>>
  public [SET_PROMISES_KEY]: Map<K, Promise<void>>
  public [HAS_PROMISES_KEY]: Map<K, Promise<boolean>>
  public [DELETE_PROMISES_KEY]: Map<K, Promise<void>>
  public [EVENT_EMITTER_KEY]: EventEmitter<CacheEventMap<K, T>>

  constructor(cache?: SupportedInnerCache<K, T>) {
    this[CACHE_KEY] = cache || new Cache<K, T>()
    this[GET_PROMISES_KEY] = new Map()
    this[SET_PROMISES_KEY] = new Map()
    this[HAS_PROMISES_KEY] = new Map()
    this[DELETE_PROMISES_KEY] = new Map()
    this[EVENT_EMITTER_KEY] = createEventEmitter<CacheEventMap<K, T>>()
  }

  get (key: K): Promise<T | undefined> {
    // A get() is currently running
    const existingGetPromise = this[GET_PROMISES_KEY].get(key)
    if (existingGetPromise) {
      return existingGetPromise
    }

    // A set() is currently running
    // We want to wait for it to end
    const existingSetPromise = this[SET_PROMISES_KEY].get(key)
    if (existingSetPromise) {
      const getPromise = new Promise<T | undefined>((resolve, reject) => {
        existingSetPromise.finally(() => {
          getValuePromise<K, T>(this, key).then(resolve, reject)
        })
      })

      this[GET_PROMISES_KEY].set(key, getPromise)

      return getPromise
    }

    // The double wrapping is a defense against finally()
    const getPromise = getValuePromise<K, T>(this, key)

    this[GET_PROMISES_KEY].set(key, getPromise)

    return getPromise
  }

  set (key: K, value: T): Promise<void> {
    const existingSetPromise = this[SET_PROMISES_KEY].get(key)

    if (existingSetPromise) {
      const setPromise = new Promise<void>((resolve, reject) => {
        existingSetPromise.finally(() => {
          Promise.resolve(this[CACHE_KEY].set(key, value)).then((result) => {
            this[EVENT_EMITTER_KEY].emit('set', key, value)
            resolve(result)
          }).catch(reject)
        })
      }).then(() => {
        this[SET_PROMISES_KEY].delete(key)
      }).catch((e) => {
        this[SET_PROMISES_KEY].delete(key)
        return Promise.reject(e)
      })

      this[SET_PROMISES_KEY].set(key, setPromise)

      return Promise.resolve(setPromise)
    }

    const setPromise = Promise.resolve(this[CACHE_KEY].set(key, value)).then(() => {
      this[EVENT_EMITTER_KEY].emit('set', key, value)
      this[SET_PROMISES_KEY].delete(key)
    }).catch((e) => {
      this[SET_PROMISES_KEY].delete(key)
      return Promise.reject(e)
    })

    this[SET_PROMISES_KEY].set(key, setPromise)

    return setPromise
  }

  has (key: K): Promise<boolean> {
    const existingHasPromise = this[HAS_PROMISES_KEY].get(key)
    if (existingHasPromise) {
      return existingHasPromise
    }

    // A set() is currently running
    // We want to wait for it to end
    const existingSetPromise = this[SET_PROMISES_KEY].get(key)
    if (existingSetPromise) {
      const hasPromise = new Promise<boolean>((resolve, reject) => {
        existingSetPromise.finally(() => {
          // actual get
          const result = this[CACHE_KEY].has(key)
          Promise.resolve(result).then((result) => {
            this[HAS_PROMISES_KEY].delete(key)
            return result
          }).then(resolve).catch((e) => {
            this[HAS_PROMISES_KEY].delete(key)
            reject(e)
          })
        })
      })

      this[HAS_PROMISES_KEY].set(key, hasPromise)

      return hasPromise
    }

    // The double wrapping is a defense against finally()
    const hasPromise = new Promise<boolean>((resolve, reject) => {
      Promise.resolve(this[CACHE_KEY].has(key)).then((result) => {
        this[HAS_PROMISES_KEY].delete(key)
        resolve(result)
      }).catch((e) => {
        this[HAS_PROMISES_KEY].delete(key)
        reject(e)
      })
    })

    this[HAS_PROMISES_KEY].set(key, hasPromise)

    return hasPromise
  }

  delete (key: K): Promise<void> {
    const existingPromise = this[DELETE_PROMISES_KEY].get(key)
    if (existingPromise) {
      return existingPromise
    }
    const deletePromise = Promise.resolve(Promise.resolve(this[CACHE_KEY].delete(key)).then(() => {
      this[EVENT_EMITTER_KEY].emit('delete', key)
      this[DELETE_PROMISES_KEY].delete(key)
      return undefined
    }, (e) => {
      this[DELETE_PROMISES_KEY].delete(key)
      return Promise.reject(e)
    }))

    this[DELETE_PROMISES_KEY].set(key, deletePromise)
    return deletePromise
  }

  keys (): AsyncIterableIterator<K> {
    return getAsyncIterator(this[CACHE_KEY].keys())
  }

  values (): AsyncIterableIterator<T> {
    return getAsyncIterator(this[CACHE_KEY].values())
  }

  entries (): AsyncIterableIterator<[K, T]> {
    return getAsyncIterator(this[CACHE_KEY].entries())
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  on <M extends CacheEventMap<K, T> = CacheEventMap<K, T>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    return subscribe<M, EK>(this[EVENT_EMITTER_KEY], eventName, listener)
  }

  clean (): Promise<void> {
    if (typeof (this[CACHE_KEY] as ICache<K, T> | IAsyncCache<K, T>).clean === 'function') {
      return promisify((this[CACHE_KEY] as ICache<K, T> | IAsyncCache<K, T>).clean()).then(() => {
        this[EVENT_EMITTER_KEY].emit('clean')
      })
    }

    // Unless we got another implementation, we will go over each key and remove it
    const keysIterator = this.keys()
    return new Promise<void>((resolve, reject) => {
      const deletePromises: Promise<void>[] = []

      // loop:
      const enrichDeletePromises = (iterator: AsyncIterableIterator<K>, deletePromises: Promise<void>[]): Promise<void> => {
        return keysIterator.next().then(({ value: key, done }) => {
          const existingDeletePromise = this[DELETE_PROMISES_KEY].get(key)
          deletePromises.push(existingDeletePromise || this.delete(key))

          if (!done) {
            return enrichDeletePromises(iterator, deletePromises)
          }
          return undefined
        }).catch(reject)
      }

      return enrichDeletePromises(keysIterator, deletePromises).then(() => {
        return Promise.all(deletePromises).then(() => {
          resolve(undefined)
          this[EVENT_EMITTER_KEY].emit('clean')
        }).catch(reject)
      })
    })
  }

  [Symbol.dispose] () {
    return this.clean()
  }
}

export default AsyncCache
