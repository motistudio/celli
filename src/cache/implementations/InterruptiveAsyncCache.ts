import type {
  Key,
  Cache as ICache,
  AsyncCache as IAsyncCache,
  AbstractCache as IAbstractCache,
  BaseCache
} from '../../types/cache.t'

import getAsyncIterator from '../../commons/iterators/getAsyncIterator'
import Observable from '../../commons/observables/Observable'
import isThentable from '../../commons/promise/isThentable'

import {
  CACHE_KEY,
  SET_STREAM_KEY,
  GET_PROMISES_KEY,
  SET_PROMISES_KEY,
  HAS_PROMISES_KEY,
  DELETE_PROMISES_KEY
} from '../constants'

// get, set overrides get
// get should be a wrapper in case it's interrupted by set

type SupportedInnerCache<K extends Key, T> = ICache<K, T> | IAsyncCache<K, T> | IAbstractCache<K, T> | BaseCache<K, T>

class InterruptiveAsyncCache<K extends Key, T> implements IAsyncCache<K, T> {
  public [CACHE_KEY]: SupportedInnerCache<K, T>
  public [GET_PROMISES_KEY]: Map<K, Promise<T | undefined>>
  public [SET_PROMISES_KEY]: Map<K, Promise<void>>
  public [HAS_PROMISES_KEY]: Map<K, Promise<boolean>>
  public [DELETE_PROMISES_KEY]: Map<K, Promise<void>>
  public [SET_STREAM_KEY]: Observable<[K, T, Promise<void> | undefined]>

  constructor (cache?: SupportedInnerCache<K, T>) {
    this[CACHE_KEY] = cache || new Map()
    this[GET_PROMISES_KEY] = new Map()
    this[SET_PROMISES_KEY] = new Map()
    this[HAS_PROMISES_KEY] = new Map()
    this[DELETE_PROMISES_KEY] = new Map()
    this[SET_STREAM_KEY] = new Observable()
  }

  // TODO: describe logic as a utility, since delete() and maybe even has() should work the same
  // TODO: extract all get scenarios outside (regular, while a set(), async)
  get (key: K): Promise<T | undefined> {
    // A get() is currently running
    const existingGetPromise = this[GET_PROMISES_KEY].get(key)
    if (existingGetPromise) {
      return existingGetPromise
    }
    
    // A set() is currently running
    // TODO: maybe this logic belongs inside the wrapping promise
    const existingSetPromise = this[SET_PROMISES_KEY].get(key)
    if (existingSetPromise) {
      const getPromise = Promise.resolve(existingSetPromise.then(() => {
        // TODO: the deletion should come after the get, but here it will create a recursion.
        // This has to be fixed with the ability to "get" the value normally without saving a promise
        // Since this whole promise should be saved, and still has every other issue of the potential race condition
        // this[GET_PROMISES_KEY].delete(key)
        return this[CACHE_KEY].get(key)
      }))

      this[GET_PROMISES_KEY].set(key, getPromise)

      return getPromise
    }

    const result = this[CACHE_KEY].get(key)

    // Describing a new get promise
    const getPromise = isThentable(result) ? (new Promise<T | undefined>((resolve, reject) => {
      let isResolved = false
      let latestPromise: Promise<T | undefined | void> | undefined = this[SET_PROMISES_KEY].get(key)?.then(() => result) || result

      const finish = (promise: Promise<unknown> | undefined, callback: () => any) => {
        if (!isResolved && promise === latestPromise) {
          callback()
          subscription.unsubscribe()

          const currentGetPromise = this[GET_PROMISES_KEY].get(key)

          // We don't need to check that it wasn't overrided, because there could only be one get function at a time (per key)
          if (currentGetPromise) {
            this[GET_PROMISES_KEY].delete(key)
          }
          isResolved = true
        }
      }

      const subscription = this[SET_STREAM_KEY].subscribe(([incomingKey, value, setPromise]) => {
        if (key === incomingKey) {
          // interrupt!
          latestPromise = setPromise
          if (setPromise) {
            setPromise.then(() => finish(setPromise, () => resolve(value))).catch((e) => finish(setPromise, () => reject(e)))
          } else {
            finish(latestPromise, () => resolve(value))
          }
        }
      })

      const currentLatestPromise = latestPromise // `this & that` pattern
      currentLatestPromise?.then((value) => finish(currentLatestPromise, () => resolve(value as T))).catch((e) => finish(currentLatestPromise, () => reject(e)))
    })) : Promise.resolve(result).then((value) => {
      const currentGetPromise = this[GET_PROMISES_KEY].get(key)

      // Check that it wasn't overrided
      if (currentGetPromise) {
        this[GET_PROMISES_KEY].delete(key)
      }

      return value
    })

    this[GET_PROMISES_KEY].set(key, getPromise)

    return getPromise
  }

  // problem is the circularity of the set (set could also be interrupted)
  // suggestion: make another interrupting mechanism for the set promise itself
  // suggestion 2: fire an event of [value, setPromise]
  set (key: K, value: T): Promise<void> {
    const result = this[CACHE_KEY].set(key, value)

    if (isThentable(result)) {
      const setPromise = new Promise<void>((resolve, reject) => {
        let isResolved = false

        const finish = (callback: () => any) => {
          if (!isResolved) {
            callback()
            subscription.unsubscribe()

            const currentSetPromise = this[SET_PROMISES_KEY].get(key)

            // Check that it wasn't overrided
            if (currentSetPromise && currentSetPromise === setPromise) {
              this[SET_PROMISES_KEY].delete(key)
            }
          }
          isResolved = true
        }

        const subscription = this[SET_STREAM_KEY].subscribe(([incomingKey,, incomingSetPromise]) => {
          if (incomingKey === key) {
            // const existingSetPromise = this[SET_PROMISES_KEY].get(key)
            if (!incomingSetPromise) {
              finish(() => resolve())
            } else if (incomingSetPromise !== setPromise) {
              incomingSetPromise.then((value) => finish(() => resolve(value))).catch((e) => finish(() => reject(e)))
            }
          }
        })

        result.then((value) => finish(() => resolve(value))).catch((e) => finish(() => reject(e)))
      })

      this[SET_PROMISES_KEY].set(key, setPromise)

      // The notification has to happen only after we set the current set promise!
      this[SET_STREAM_KEY].next([key, value, setPromise])

      return result
    }

    // if sync, just fire the event and return a Promise<void>
    const setPromise = Promise.resolve()
    this[SET_STREAM_KEY].next([key, value, setPromise])

    // TODO: should also be cached, probably
    return setPromise
  }

  has (key: K): Promise<boolean> {
    const existingHasPromise = this[HAS_PROMISES_KEY].get(key)
    if (existingHasPromise) {
      return existingHasPromise
    }

    const hasPromise = (new Promise<boolean>((resolve, reject) => {
      // TODO: Add an interruption method
      let isResolved = false;

      const finish = (callback: () => any) => {
        if (!isResolved) {
          callback()
          subscription.unsubscribe()
        }
        isResolved = true
      }

      const subscription = this[SET_STREAM_KEY].subscribe(([setterKey, value]) => {
        if (key === setterKey) {
          finish(() => resolve(true))
        }
      })
      Promise.resolve(this[CACHE_KEY].has(key)).then((value) => finish(() => resolve(value))).catch((e) => finish(() => reject(e)))
    })).then((result) => {
      this[HAS_PROMISES_KEY].delete(key)

      return result
    })

    this[HAS_PROMISES_KEY].set(key, hasPromise)

    return hasPromise
  }

  delete (key: K): Promise<void> {
    const existingPromise = this[DELETE_PROMISES_KEY].get(key)
    if (existingPromise) {
      return existingPromise
    }
    const deletePromise = Promise.resolve(this[CACHE_KEY].delete(key)).then(() => {
      this[DELETE_PROMISES_KEY].delete(key)
      return undefined
    })
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

  clean () {
    if (typeof (this[CACHE_KEY] as (ICache<K, T> | IAsyncCache<K, T>)).clean === 'function') {
      const result = (this[CACHE_KEY] as (ICache<K, T> | IAsyncCache<K, T>)).clean()
      return isThentable(result) ? result : Promise.resolve(result)
    }

    const keysIterator = this.keys()
    return new Promise<void>((resolve, reject) => {
      const deletePromises: Promise<void>[] = []

      // loop:
      const enrichDeletePromises = (iterator: AsyncIterableIterator<K>, deletePromises: Promise<void>[]): Promise<void> => {
        return keysIterator.next().then(({value: key, done}) => {
          const existingDeletePromise = this[DELETE_PROMISES_KEY].get(key)
          deletePromises.push(existingDeletePromise || this.delete(key))

          if (!done) {
            return enrichDeletePromises(iterator, deletePromises)
          }
          return undefined
        }).catch(reject)
      }

      return enrichDeletePromises(keysIterator, deletePromises).then(() => {
        return Promise.all(deletePromises).then(() => resolve(undefined)).catch(reject)
      })
    })
  }
}

export default InterruptiveAsyncCache
