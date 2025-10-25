import forEach from '../../commons/iterators/forEach'

const cleanRefKeys = (keySet: Set<WeakRef<any>>) => {
  forEach(keySet.values(), (cacheRef) => {
    const cache = cacheRef.deref()
    if (!cache) {
      keySet.delete(cacheRef)
    }
  })
}

export default cleanRefKeys
