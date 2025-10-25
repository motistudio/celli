import type {
  CacheKey,
  CacheValue,
  AnyCacheType,
  WrappedCache,
  CacheEventMap,
  CacheEventMapKey
} from '../../../types/cache.t'
import type {Effect} from '../../../types/effects.t'

import LifeCycleCache from '../LifeCycleCache'

import {CACHE_KEY} from '../../constants'
import { EventListener } from '../../../types/eventEmitter.t'

const EFFECTS_KEY = Symbol('effects-cache-effects')

const DEFAULT_EFFECTS: Effect<any>[] = []

class EffectsCache<C extends AnyCacheType<any, any>> implements WrappedCache<C> {
  public [CACHE_KEY]: LifeCycleCache<C>
  public [EFFECTS_KEY]: Effect<CacheValue<C>>[]
  constructor (cache: C, effects?: Effect<CacheValue<C>>[]) {
    this[CACHE_KEY] = new LifeCycleCache<C>(cache)
    this[EFFECTS_KEY] = effects || (DEFAULT_EFFECTS as Effect<CacheValue<C>>[])
  }

  get (...args: Parameters<C['get']>): ReturnType<C['get']> {
    return this[CACHE_KEY].get.apply(this[CACHE_KEY], args)
  }

  set (key: CacheKey<C>, value: CacheValue<C>) {
    return this[CACHE_KEY].set.apply(this[CACHE_KEY], [key, value, this[EFFECTS_KEY]])
  }

  has (...args: Parameters<C['has']>) {
    return this[CACHE_KEY].has.apply(this[CACHE_KEY], args)
  }

  delete (...args: Parameters<C['delete']>) {
    return this[CACHE_KEY].delete.apply(this[CACHE_KEY], args)
  }

  keys () {
    return this[CACHE_KEY].keys()
  }

  values () {
    return this[CACHE_KEY].values()
  }

  entries () {
    return this[CACHE_KEY].entries()
  }

  [Symbol.iterator] () {
    return this[CACHE_KEY][Symbol.iterator]()
  }

  [Symbol.asyncIterator] () {
    return this[CACHE_KEY][Symbol.asyncIterator]()
  }

  clean () {
    return this[CACHE_KEY].clean()
  }

  on <M extends CacheEventMap<CacheKey<C>, CacheValue<C>> = CacheEventMap<CacheKey<C>, CacheValue<C>>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    return this[CACHE_KEY].on(eventName, listener)
  }
}

export default EffectsCache
