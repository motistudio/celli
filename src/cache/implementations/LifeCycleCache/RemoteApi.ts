import isComplexType from '../../../commons/isComplexType'
import type {AnyCacheType, CacheKey, CacheValue} from '../../../types/cache.t'
import {type AbstractEffectApi} from '../../../types/effects.t'

import {
  REMOTE_REF,
  INTERNAL_REMOTE_CLEAN,
  INTERNAL_REMOTE_READ,
  type LifeCycleCache
} from './constants'

const KEY_REF = Symbol('key-ref')
const LAST_VALUE = Symbol('last-value')
const LAST_VALUE_REF = Symbol('last-value-ref')
const LISTENERS = Symbol('listeners')

const setValue = <R extends RemoteApi<LifeCycleCache<AnyCacheType<any, any>>>>(remote: R, value: any) => {
  const isComplex = isComplexType(value)
  remote[LAST_VALUE] = isComplex ? undefined : value
  remote[LAST_VALUE_REF] = isComplex ? new WeakRef(value) : undefined
}

/**
 * A remote for a single key item
 * The purpose of this class is to avoid callbacks to save up memory
 * @todo Remove the double binding, let the garbage collector collect
 */
class RemoteApi<C extends LifeCycleCache<AnyCacheType<any, any>>> implements AbstractEffectApi<CacheValue<C>> {
  public [REMOTE_REF]: C
  public [KEY_REF]: CacheKey<C>
  public [LAST_VALUE]: CacheValue<C> | undefined
  public [LAST_VALUE_REF]: WeakRef<CacheValue<C>> | undefined
  public [LISTENERS]: Parameters<AbstractEffectApi<CacheValue<C>>['onRead']>[0][]

  constructor (cache: C, key: CacheKey<C>, initialValue: CacheValue<C>) {
    this[REMOTE_REF] = cache
    this[KEY_REF] = key
    this[LISTENERS] = []
    setValue(this, initialValue)
  }

  getSelf (): CacheValue<C> {
    if (this[LAST_VALUE]) {
      return this[LAST_VALUE]
    }
    return this[LAST_VALUE_REF]?.deref() as CacheValue<C> // Will necessarily work since new onRead()s will not create new values
  }

  deleteSelf () {
    return this[REMOTE_REF].delete(this[KEY_REF])
  }

  onRead (callback: (() => void)) {
    this[LISTENERS].push(callback)
  }

  [INTERNAL_REMOTE_READ] (value: CacheValue<C>) {
    setValue(this, value)
    this[LISTENERS].forEach((listener) => listener())
  }

  [INTERNAL_REMOTE_CLEAN] () {
    this[LISTENERS] = []
  }
}

export default RemoteApi
