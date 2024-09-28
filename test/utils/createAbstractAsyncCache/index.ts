import type {AbstractCache, Key} from '../../../src/types/cache.t'
import delay from '../../../src/commons/promise/delay'

const tick = () => delay(5)

class AbstractAsyncCache<K extends Key, T> implements AbstractCache<K, T> {
  public cache: Map<K, T>
  constructor () {
    this.cache = new Map<K, T>()
  }

  get (key: K) {
    return tick().then(() => {
      return this.cache.get(key)
    })
  }

  set (key: K, value: T) {
    return tick().then(() => {
      this.cache.set(key, value)
    })
  }

  has (key: K) {
    return tick().then(() => {
      return this.cache.has(key)
    })
  }

  delete (key: K) {
    return tick().then(() => {
      this.cache.delete(key)
    })
  }

  keys(): IterableIterator<K> | AsyncIterableIterator<K> {
    return this.cache.keys()
  }

  values(): IterableIterator<T> | AsyncIterableIterator<T> {
    return this.cache.values()
  }

  entries(): IterableIterator<[K, T]> | AsyncIterableIterator<[K, T]> {
    return this.cache.entries()
  }

  clean (): Promise<void> {
    return tick().then(() => {
      this.cache = new Map<K, T>()
    })
  }

  [Symbol.iterator] () {
    return this.cache.entries()
  }
}

const createAbstractAsyncCache = <K extends Key, T>() => {
  return new AbstractAsyncCache<K, T>()
}

export default createAbstractAsyncCache
