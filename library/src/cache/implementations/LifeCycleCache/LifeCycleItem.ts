import type {Effect, Cleanup} from '../../../types/effects.t'
import type {AnyCacheType} from '../../../types/cache.t'

import isThentable from '../../../commons/promise/isThentable'
import reduce from '../../../commons/iterators/reduce'

import {
  INTERNAL_REMOTE_READ,
  INTERNAL_REMOTE_CLEAN,
  type LifeCycleCache
} from './constants'
import RemoteApi from './RemoteApi'

/**
 * LifeCycleItem is a wrapper around a RemoteApi that allows for cleanup of effects
 * @template T - The type of the value
 */
class LifeCycleItem<T> {
  public remoteApi: RemoteApi<LifeCycleCache<AnyCacheType<any, any>>>
  public cleanupCalls: Set<Cleanup>

  constructor (effects: Effect<T>[], remoteApi: RemoteApi<LifeCycleCache<AnyCacheType<any, T>>>) {
    this.remoteApi = remoteApi
    this.cleanupCalls = new Set<Cleanup>()

    this.cleanupCalls = new Set(effects.reduce<Cleanup[]>((cleanups, effect) => {
      const cleanup = effect(this.remoteApi)
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup)
      }
      return cleanups
    }, []))
  }

  read (value: T) {
    this.remoteApi[INTERNAL_REMOTE_READ](value)
  }

  clean () {
    this.cleanupCalls.values()
    const cleanupPromises = reduce<Promise<void>[], Cleanup>(this.cleanupCalls.values(), (promises, cleanup) => {
      const promise = cleanup()
      if (isThentable(promise)) {
        promises.push(promise)
      }
      this.cleanupCalls.delete(cleanup)
      return promises
    }, [])

    if (cleanupPromises.length) {
      return Promise.all(cleanupPromises).then(() => undefined).then(() => {
        this.remoteApi[INTERNAL_REMOTE_CLEAN]()
      })
    }
    this.remoteApi[INTERNAL_REMOTE_CLEAN]()
  }
}

export default LifeCycleItem
