import type {
  Key,
  AsyncCache,
  CacheEventMap,
  CacheEventMapKey
} from '../../types/cache.t'
import type {
  EventEmitter,
  EventListener
} from '../../types/eventEmitter.t'

import createEventEmitter from '../../commons/eventEmitter/createEventEmitter'
import subscribe from '../../commons/eventEmitter/subscribe'
import evaluate from '../../commons/evaluate'

import Cache from '../implementations/Cache'
import {CACHE_KEY, EVENT_EMITTER_KEY} from '../constants'
import {OPTIONS_KEY, type SourceOptions} from './constants'
import compile from './compile'

const COMPILED_OPTIONS = Symbol()

class SourceAsyncCache<K extends Key, T> implements AsyncCache<K, T> {
  public [OPTIONS_KEY]: SourceOptions<K, T>
  public [CACHE_KEY]: Cache<K, T>
  public [COMPILED_OPTIONS]: ReturnType<typeof compile<K, T>>
  public [EVENT_EMITTER_KEY]: EventEmitter<CacheEventMap<K, T>>

  constructor (options: SourceOptions<K, T>) {
    this[OPTIONS_KEY] = options
    this[CACHE_KEY] = new Cache<K, T>() // local cache for backup, hopefully it stays empty
    this[COMPILED_OPTIONS] = compile(options)
    this[EVENT_EMITTER_KEY] = createEventEmitter<CacheEventMap<K, T>>()
  }

  get (key: K): Promise<T | undefined> {
    return this[COMPILED_OPTIONS].get(key).then((result) => {
      this[EVENT_EMITTER_KEY].emit('get', key)
      return result
    })
  }

  set (key: K, value: T): Promise<void> {
    return this[COMPILED_OPTIONS].set(key, value).then((result) => {
      this[EVENT_EMITTER_KEY].emit('set', key, value)
      return result
    })
  }

  has (key: K): Promise<boolean> {
    return this[COMPILED_OPTIONS].has(key)
  }

  delete(key: K): Promise<void> {
    return this[COMPILED_OPTIONS].delete(key).then((result) => {
      this[EVENT_EMITTER_KEY].emit('delete', key)
      return result
    })
  }

  keys () {
    return this[COMPILED_OPTIONS].keys()
  }

  values () {
    return this[COMPILED_OPTIONS].values()
  }

  entries () {
    return this[COMPILED_OPTIONS].entries()
  }

  [Symbol.asyncIterator] () {
    return this.entries()
  }

  clean (): Promise<void> {
    return this[COMPILED_OPTIONS].clean().then((result) => {
      this[EVENT_EMITTER_KEY].emit('clean')
      return result
    })
  }

  on <M extends CacheEventMap<K, T> = CacheEventMap<K, T>, EK extends CacheEventMapKey = CacheEventMapKey>(eventName: EK, listener: EventListener<M[EK]>) {
    return subscribe<M, EK>(this[EVENT_EMITTER_KEY], eventName, listener)
  }
}

export default SourceAsyncCache
