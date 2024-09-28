import type {
  Key,
  BaseCache,
  Cache as ICache,
  AsyncCache as IAsyncCache,
  AbstractCache as IAbstractCache,
  AsyncInnerCache
} from '../types/cache.t'
import type {Effect, Cleanup} from '../types/effects.t'
import type {Observable as IObservable} from '../types/observables.t'

import getAsyncIterator from '../commons/iterators/getAsyncIterator'
import isThentable from '../commons/promise/isThentable'
import Observable from '../commons/observables/Observable'

type EffectCallbackApi<T> = Parameters<Parameters<Parameters<Effect<T>>[1]['onRead']>[0]>[0]

const cacheKey = Symbol.for('cache')
const getPromiseKey = Symbol.for('cache-promise-getter')
const setPromiseKey = Symbol.for('cache-promise-setter')
const cleanupPromiseKey = Symbol.for('cache-promise-cleanup-setter')

const DEFAULT_EFFECTS: Effect<any>[] = []

const createCleanup = <T>(api: EffectCallbackApi<T>, stream: IObservable<T>, effects: Effect<T>[]): Cleanup => {
  const unsubscribeCalls: Cleanup[] = []

  // insert API
  const onRead = (callback: Parameters<Parameters<Effect<T>>[1]['onRead']>[0]) => {
    const subscription = stream.subscribe(() => callback(api))
    unsubscribeCalls.push(subscription.unsubscribe)
  }

  const effectsCleanups = effects.reduce<Cleanup[]>((cleanups, effect) => {
    const cleanup = effect(api.get(), {onRead})
    if (typeof cleanup === 'function') {
      cleanups.push(cleanup)
    }
    return cleanups
  }, [])

  return () => {
    unsubscribeCalls.forEach((unsubscribe) => unsubscribe())
    const cleanupPromises = effectsCleanups.reduce<Promise<void>[]>((promises, cleanup) => {
      const promise = cleanup()
      if (isThentable(promise)) {
        promises.push(promise)
      }
      return promises
    }, [])

    if (cleanupPromises.length) {
      return Promise.all(cleanupPromises).then(() => undefined)
    }
  }
}

class LifeCycleItem<T> {
  public val: T
  public isCleaned: boolean
  public cleanup: Cleanup
  public stream: IObservable<T>

  constructor (value: T, effects: Effect<T>[], removeSelf: () => void) {
    this.val = value
    this.isCleaned = false
    this.stream = new Observable<T>()

    const api = {
      get: () => this.val,
      remove: () => {
        if (!this.isCleaned) {
          removeSelf()
        }
      }
    }

    this.cleanup = createCleanup(api, this.stream, effects)
  }

  get value (): T {
    if (this.isCleaned) {
      throw new Error('Attempt to read a value that has been removed')
    }
    this.stream.next(this.val)
    return this.val
  }

  clean () {
    if (this.isCleaned) {
      throw new Error('Attempt to clean a value twice')
    }
    this.isCleaned = true
    return this.cleanup()
  }
}

class LifeCycleCache<K extends Key, T> implements IAsyncCache<K, T> {
  public [cacheKey]: AsyncInnerCache<K, LifeCycleItem<T>>
  public [getPromiseKey]: Map<K, Promise<LifeCycleItem<T> | undefined>>
  public [setPromiseKey]: Map<K, Promise<LifeCycleItem<T>>>
  public [cleanupPromiseKey]: Promise<void>[]

  constructor (cache?: AsyncInnerCache<K, LifeCycleItem<T>>) {
    this[cacheKey] = cache || new Map()
    this[getPromiseKey] = new Map()
    this[setPromiseKey] = new Map()
    this[cleanupPromiseKey] = []
  }

  set (key: K, value: T, effects?: Effect<T>[]) {
    // TODO: clean if exists
    const result = this[cacheKey].set(key, new LifeCycleItem(value, effects || DEFAULT_EFFECTS, () => this.delete(key)))
    if (isThentable(result)) {
      return result
    }
    const setPromise = Promise.resolve(result).then(() => {
      this[setPromiseKey].delete(key)
      return undefined
    })
    return setPromise
  }

  get (key: K) {
    return Promise.resolve(this[cacheKey].get(key)).then((item) => {
      return item?.value
    })
  }

  has (key: K) {
    return Promise.resolve(this[cacheKey].has(key))
  }

  delete (key: K) {
    return Promise.resolve(this[cacheKey].get(key)).then((item) => {
      if (item) {
        // trigger deletion
        const promise = item.clean()
        if (isThentable(promise)) {
          const cleanupPromise = promise.then(() => {
            const index = this[cleanupPromiseKey].indexOf(cleanupPromise)
            if (index > -1) {
              this[cleanupPromiseKey].splice(index, 1)
            }
          })
          this[cleanupPromiseKey].push(cleanupPromise)
        }
        return this[cacheKey].delete(key)
      }
      return undefined
    })
  }

  keys () {
    return getAsyncIterator(this[cacheKey].keys())
  }

  async * values () {
    for await (const item of this[cacheKey].values()) {
      // trigger read
      yield item.value
    } 
  }

  async * entries () {
    for await (const [key, item] of this[cacheKey].entries()) {
      // trigger read
      yield [key, item.value] as [K, T]
    } 
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  clean () {
    const deletePromises = Object.keys(this).map((key) => this.delete(key as K))

    // get the cleanup promises out of the main property to avoid a race condition
    const cleanupPromises = this[cleanupPromiseKey]
    this[cleanupPromiseKey] = []

    return Promise.all([...deletePromises, cleanupPromises]).then(() => undefined)
  }
}

export default LifeCycleCache
