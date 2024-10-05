import type {Key, AsyncCache} from '../../types/cache.t'

import promisify from '../../commons/promise/promisify'
import getAsyncIterator from '../../commons/iterators/getAsyncIterator'

import Cache from '../implementations/Cache'
import {CACHE_KEY} from '../constants'
import {OPTIONS_KEY, type SourceOptions} from './constants'
import compile from './compile'

const COMPILED_OPTIONS = Symbol()

class SourceAsyncCache<K extends Key, T> implements AsyncCache<K, T> {
  public [OPTIONS_KEY]: SourceOptions<K, T>
  public [CACHE_KEY]: Cache<K, T>
  public [COMPILED_OPTIONS]: ReturnType<typeof compile<K, T>>
  constructor (options: SourceOptions<K, T>) {
    this[OPTIONS_KEY] = options
    this[CACHE_KEY] = new Cache<K, T>() // local cache for backup, hopefully it stays empty
    this[COMPILED_OPTIONS] = compile(options)
  }

  get (key: K): Promise<T | undefined> {
    return this[COMPILED_OPTIONS].get(key)
  }

  set (key: K, value: T): Promise<void> {
    return this[COMPILED_OPTIONS].set(key, value)
  }

  has (key: K): Promise<boolean> {
    return this[COMPILED_OPTIONS].has(key)
  }

  delete(key: K): Promise<void> {
    return this[COMPILED_OPTIONS].delete(key)
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
    return this[COMPILED_OPTIONS].clean()
  }
}

export default SourceAsyncCache
