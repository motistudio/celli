import evaluate from '../evaluate'

type Callback<T> = (item: T, index: number) => Promise<void> | void

const innerForEach = <T>(it: IterableIterator<T> | AsyncIterableIterator<T>, index: number, callback: Callback<T>): Promise<void> | void => {
  return evaluate(it.next(), (item) => {
    if (!item.done) {
      const result = callback(item.value, index)
      return evaluate(result, () => innerForEach(it, index + 1, callback))
    }
  })
}

/**
 * Iterates over an iterator
 * If the iterator is async then it will return a promise
 * @template T
 * @param {IterableIterator<T> | AsyncIterableIterator<T>} it - any iterator
 * @param {Callback<T>} callback - A callback to run per item 
 * @returns {Promise<void> | void} If a promise
 */
const forEach = <T>(it: IterableIterator<T> | AsyncIterableIterator<T>, callback: Callback<T>): Promise<void> | void => {
  return innerForEach(it, 0, callback)
}

export default forEach
