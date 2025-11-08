import isThentable from '../promise/isThentable'

const key = Symbol.for('async-iterable-iterator-wrapper-key')

class AsyncIterableIteratorWrapper<T> {
  public [key]: IterableIterator<T> | AsyncIterableIterator<T>
  constructor (it: IterableIterator<T> | AsyncIterableIterator<T>) {
    this[key] = it
  }

  next () {
    const item = this[key].next()
    if (isThentable(item)) {
      return item
    }
    return Promise.resolve(item)
  }

  [Symbol.asyncIterator] () {
    return this
  }
}

/**
 * Turns an IterableIterator into an AsyncIterableIterator
 * @param it - Either an IterableIterator or AsyncIterableIterator
 * @returns {AsyncIterableIterator}
 */
const getAsyncIterator = <T>(it: IterableIterator<T> | AsyncIterableIterator<T>): AsyncIterableIterator<T> => {
  return new AsyncIterableIteratorWrapper(it)
}

export default getAsyncIterator
