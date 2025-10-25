const findInner = <T>(it: Iterator<T, T, T> | IterableIterator<T>, callback: (item: T, index: number) => boolean, index: number): T | undefined => {
  const item = it.next()
  if (item.done) {
    return undefined
  }
  if (callback(item.value, index)) {
    return item.value
  }
  return findInner(it, callback, index + 1)
}

const find = <T = any>(it: Iterator<T, T, T> | IterableIterator<T>, callback: (item: T, index: number) => boolean): T | undefined => {
  return findInner<T>(it, callback, 0)
}

export default find
