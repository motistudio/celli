const reduceInner = <U, T>(it: Iterator<T, T, T> | IterableIterator<T>, callback: (accumulator: U, item: T, index: number) => U, index: number, initialValue: U): U => {
  const item = it.next()
  if (!item || item.done) {
    return initialValue
  }
  return reduceInner(it, callback, index + 1, callback(initialValue, item.value, index))
}

const reduce = <U, T = any>(it: Iterator<T, T, T> | IterableIterator<T>, callback: (accumulator: U, item: T, index: number) => U, initialValue: U): U => {
  return reduceInner<U, T>(it, callback, 0, initialValue)
}

export default reduce
