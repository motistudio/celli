import isThentable from '../promise/isThentable'

const innerReduce = <U, T>(it: IterableIterator<T> | AsyncIterableIterator<T>, callback: (accumulator: U, item: T, index: number) => U | Promise<U>, index: number, initialValue: U): Promise<U> => {
  const item = it.next()
  return Promise.resolve(item).then((item) => {
    if (item.done) {
      return Promise.resolve(initialValue)
    }
    const result = callback(initialValue, item.value, index)
    return isThentable(result) ? result.then((result) => innerReduce(it, callback, index + 1, result)) : innerReduce(it, callback, index + 1, result)
  })
}

/**
 * Maps over an iterator
 * @param it - Any iterator
 * @param callback - A function which will receive each item and return another
 * @returns {Array<U>} An array of U[]
 */
const reduce = <U, T = any>(it: IterableIterator<T> | AsyncIterableIterator<T>, callback: (accumulator: U, item: T, index: number) => U | Promise<U>, initialValue: U): Promise<U> => {
  return innerReduce<U, T>(it, callback, 0, initialValue)
}

export default reduce
