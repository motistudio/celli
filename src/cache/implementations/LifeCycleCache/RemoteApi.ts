import type {CacheKey, CacheValue} from '../../../types/cache.t'
import {type EffectApi, type AbstractEffectApi, type EffectCallbackApi} from '../../../types/effects.t'

import isThentable from '../../../commons/promise/isThentable'
import {CACHE_KEY} from '../../constants'
import {
  REMOTE_REF,
  INTERNAL_REMOTE_CLEAN,
  INTERNAL_REMOTE_READ,
  type LifeCycleCache
} from './constants'

const KEY_REF = Symbol('key-ref')
const LAST_VALUE = Symbol('last-value')
const LISTENERS = Symbol('listeners')

class ListenerApi<T> implements EffectCallbackApi<T> {
  public [REMOTE_REF]: RemoteApi<LifeCycleCache<any, T>>

  constructor (remoteRef: RemoteApi<LifeCycleCache<any, T>>) {
    this[REMOTE_REF] = remoteRef
    this.get = this.get.bind(this)
  }

  get () {
    return this[REMOTE_REF].getSelf()
  }
}

/**
 * A remote for a single key item
 * The purpose of this class is to avoid callbacks to save up memory
 */
class RemoteApi<C extends LifeCycleCache<any, any>> implements AbstractEffectApi<CacheValue<C>> {
  public [REMOTE_REF]: C
  public [KEY_REF]: CacheKey<C>
  public [LAST_VALUE]: CacheValue<C>
  public [LISTENERS]: Parameters<AbstractEffectApi<CacheValue<C>>['onRead']>[0][]
  public listenerApi: ListenerApi<CacheValue<C>>

  constructor (cache: C, key: CacheKey<C>, initialValue: CacheValue<C>) {
    this[REMOTE_REF] = cache
    this[KEY_REF] = key;
    this[LAST_VALUE] = initialValue;
    this[LISTENERS] = []
    this.listenerApi = new ListenerApi(this) // double binding, a place to be careful with
  }

  getSelf (): CacheValue<C> {
    return this[LAST_VALUE]
  }

  setSelf (value: CacheValue<C>) {
    const result = this[REMOTE_REF][CACHE_KEY].set(this[KEY_REF], value)
    if (isThentable(result)) {
      return result.then((val) => {
        this[LAST_VALUE] = value
        return val
      }) as Promise<void>
    }
    this[LAST_VALUE] = value
  }
  
  deleteSelf () {
    return this[REMOTE_REF].delete(this[KEY_REF])
  }

  onRead (callback: ((utils: EffectCallbackApi<CacheValue<C>>) => void)) {
    this[LISTENERS].push(callback)
  }

  [INTERNAL_REMOTE_READ] (value: CacheValue<C>) {
    this[LAST_VALUE] = value
    this[LISTENERS].forEach((listener) => listener(this.listenerApi))
  }

  [INTERNAL_REMOTE_CLEAN] () {
    this[LISTENERS] = []
  }
}

export default RemoteApi
