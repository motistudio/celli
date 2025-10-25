import reduce from './reduce'

/**
 * Maps over an iterator
 * @param it - Any iterator
 * @param callback - A function which will receive each item and return another
 * @returns {Array<U>} An array of U[]
 */
const map = <T, U>(it: Iterator<T, T, T> | IterableIterator<T>, callback: (item: T, index: number) => U): U[] => {
  return reduce<U[]>(it, (acc, item, index) => {
    acc.push(callback(item, index))
    return acc
  }, [])
}

export default map
