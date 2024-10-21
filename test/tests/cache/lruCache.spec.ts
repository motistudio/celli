import type {Cache as ICache, AsyncCache as IAsyncCache} from '../../../src/types/cache.t'

import Cache from '../../../src/cache/implementations/Cache'
import LruCache from '../../../src/cache/implementations/LruCache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'

describe('LRU Cache', () => {
  test.each<undefined | ICache<string, string>>([undefined, new Cache()])('Should create a simple cache', (baseCache) => {
    const lruCache = new LruCache(baseCache, {maxSize: 1})
    const cache = lruCache as unknown as ICache<string, string>

    const key = 'k'
    const value = 'val'
    const value2 = 'val2'

    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)
    expect(lruCache.usedSize).toBe(0)

    cache.set(key, value)

    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value)
    expect(lruCache.usedSize).toBe(1)

    cache.set(key, value2)
    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value2)
    expect(lruCache.usedSize).toBe(1)

    cache.delete(key)
    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)
    expect(lruCache.usedSize).toBe(0)
    const currentUsedSize = lruCache.usedSize

    // Hitting delete on a non-existing cache won't change anything
    cache.delete(key)
    expect(cache.has(key)).toBe(false)
    expect(lruCache.usedSize).toBe(currentUsedSize)

    cache.set(key, value)
    expect(Array.from(cache.keys())).toMatchObject([key])
    expect(Array.from(cache.values())).toMatchObject([value])
    expect(Array.from(cache.entries())).toMatchObject([[key, value]])
    expect(Array.from(cache)).toMatchObject([[key, value]])

    cache.clean()
    expect(Array.from(cache.keys())).toMatchObject([])
  })

  test('Should create an async LRU cache', async () => {
    const cache = new LruCache(new AsyncCache(), {maxSize: 1}) as unknown as IAsyncCache<string, string>
    
    const key = 'k'
    const value = 'val'
    const value2 = 'val2'

    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)
    
    await cache.set(key, value)

    await expect(cache.has(key)).resolves.toBe(true)
    await expect(cache.get(key)).resolves.toBe(value)

    await cache.set(key, value2)
    await expect(cache.has(key)).resolves.toBe(true)
    await expect(cache.get(key)).resolves.toBe(value2)

    await cache.delete(key)
    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)

    await cache.set(key, value)
    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([key])
    await expect(Array.fromAsync(cache.values())).resolves.toMatchObject([value])
    await expect(Array.fromAsync(cache.entries())).resolves.toMatchObject([[key, value]])
    await expect(Array.fromAsync(cache)).resolves.toMatchObject([[key, value]])
    
    await cache.clean()
    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([])
  })

  test('Should limit the number of saved items', () => {
    const maxSize = 2
    const lruCache = new LruCache<ICache<string, number>>(undefined, {maxSize})
    const cache = lruCache
    // const cache = lruCache as unknown as ICache<string, number>

    const pairs: [string, number][] = [['1', 1], ['2', 2], ['3', 3]]

    cache.set(pairs[0][0], pairs[0][1])
    cache.set(pairs[1][0], pairs[1][1])

    expect(cache.has(pairs[0][0])).toBe(true)
    expect(cache.has(pairs[1][0])).toBe(true)
    expect(lruCache.usedSize).toBe(maxSize)
    expect(cache.has(pairs[2][0])).toBe(false)

    cache.set(pairs[2][0], pairs[2][1])
    expect(lruCache.usedSize).toBe(maxSize)
    expect(cache.has(pairs[2][0])).toBe(true)
    expect(cache.get(pairs[2][0])).toBe(pairs[2][1])

    // setting the same key twice will work the same
    cache.set(pairs[2][0], pairs[2][1])
    expect(lruCache.usedSize).toBe(maxSize)

    // first key is deleted (last to be saved)
    expect(cache.has(pairs[0][0])).toBe(false)

    // Getting the new last key (1), so it will be came the first
    expect(cache.get(pairs[1][0])).toBe(pairs[1][1])

    // resetting the first key
    cache.set(pairs[0][0], pairs[0][1])

    expect(cache.has(pairs[0][0])).toBe(true) // new key is indeed saved now
    expect(cache.has(pairs[1][0])).toBe(true) // the last key we got (get()) is still saved
    expect(cache.has(pairs[2][0])).toBe(false) // the actual last key (2) is deleted
    
    cache.clean()
    const values = Array.from(cache.entries())
    expect(values.length).toBe(0) // clean is synchronous
  })

  test('Should use custom cache size', () => {
    const maxSize = 3
    const pairs: [string, number, number][] = [
      ['1', 1, 1],
      ['2', 2, 2],
      ['3', 3, 1],
      ['4', 4, 2]
    ]

    const lruCache = new LruCache<ICache<string, number>>(undefined, {
      maxSize,
      getItemSize: (key) => pairs[Number.parseInt(key, 10) - 1]?.[2]
    })
    const cache = lruCache

    cache.set(pairs[0][0], pairs[0][1]) // size: 1
    cache.set(pairs[1][0], pairs[1][1]) // size: 2
    expect(lruCache.usedSize).toBe(3) // 3 is ok
    expect(lruCache.usedSize).toBe(maxSize) // but 3 is maxSize...!
    
    cache.set(pairs[2][0], pairs[2][1]) // size: 1
    expect(lruCache.usedSize).toBe(3) // it's still 3
    expect(cache.has(pairs[0][0])).toBe(false) // but the first key is deleted

    // let's advance 2 (size 2)
    cache.get(pairs[1][0])

    cache.set(pairs[3][0], pairs[3][1]) // size: 2
    // 2 + (2 + 1) is definitely bigger than 3, therefor we need to delete more than one item
    expect(cache.has(pairs[1][0])).toBe(false)
    expect(cache.has(pairs[2][0])).toBe(false)
    expect(lruCache.usedSize).toBe(pairs[3][2]) // 2
  })

  test('Should protect the input of sizes', () => {
    const maxSize = 5
    const pairs: number[] = [0, -1, 6, Infinity]
    const cache = new LruCache<ICache<number, number>>(undefined, {maxSize, getItemSize: (key) => pairs[key]})

    pairs.forEach((value, index) => {
      expect(() => cache.set(index, index)).toThrow()
    })
  })

  test('Should introduce keys via get in a composable cache', () => {
    const key = 'test'
    const value = 'test'
    const baseCache = new Cache<string, string>()

    baseCache.set(key, value)

    // LruCache is not aware about baseCache's keys
    // It happens because we're not trying to "fix" the cache we use
    // But a true real-life scenario is an async cache that might be shared between services
    const lruCache = new LruCache(baseCache, {maxSize: 2})

    const pairs: [string, string][] = [[key, value], ['k1', 'val'], ['k2', 'val2']]
    lruCache.set(pairs[1][0], pairs[1][1])
    lruCache.set(pairs[2][0], pairs[2][1])
    expect(lruCache.usedSize).toBe(2)
    
    // When we perform get, which we didn't know but is now suddenly exists
    // it's being introduced to the cache and will clean older keys
    expect(lruCache.get(key)).toBe(value)
    expect(lruCache.usedSize).toBe(2)
    expect(lruCache.has(pairs[1][0])).toBe(false)
  })

  describe('Events', () => {
    test('Should automatically remove items when the source-cache is deleting them', () => {
      const baseCache = new Cache<string, string>()
      const lruCache = new LruCache(baseCache, {maxSize: 2})

      const key = 'key'
      const value = 'value'

      lruCache.set(key, value)
      expect(lruCache.has(key)).toBe(true)
      expect(baseCache.has(key)).toBe(true)

      baseCache.delete(key)
      expect(baseCache.has(key)).toBe(false)
      expect(lruCache.has(key)).toBe(false)
    })

    test('Should listen to cache events', () => {
      const getHandler = jest.fn()
      const setHandler = jest.fn()
      const deleteHandler = jest.fn()
      const cleanHandler = jest.fn()

      const baseCache = new Cache<string, string>()
      const cache = new LruCache(baseCache, {maxSize: 1})

      const unsubscribeGet = cache.on('get', getHandler)
      const unsubscribeSet = cache.on('set', setHandler)
      const unsubscribeDelete = cache.on('delete', deleteHandler)
      const unsubscribeClean = cache.on('clean', cleanHandler)

      const key = 'key'
      const value = 'value'
  
      expect(cache.get(key)).toBe(undefined)
      expect(getHandler).toHaveBeenCalledTimes(1)
      expect(getHandler).toHaveBeenCalledWith(key)
      
      cache.set(key, value)
      expect(cache.get(key)).toBe(value)
      expect(getHandler).toHaveBeenCalledTimes(2)
      expect(setHandler).toHaveBeenCalledTimes(1)
      expect(setHandler.mock.calls.at(-1)).toMatchObject([key, value])
      
      cache.delete(key)
      expect(deleteHandler).toHaveBeenCalledTimes(1)
      expect(deleteHandler).toHaveBeenCalledWith(key)
  
      cache.clean()
      expect(cleanHandler).toHaveBeenCalledTimes(1)
  
      unsubscribeGet()
      unsubscribeSet()
      unsubscribeDelete()
      unsubscribeClean()
  
      cache.set(key, value)
      expect(setHandler).toHaveBeenCalledTimes(1)
      cache.get(key)
      expect(getHandler).toHaveBeenCalledTimes(2)
      cache.delete(key)
      expect(deleteHandler).toHaveBeenCalledTimes(1)
      cache.clean()
      expect(cleanHandler).toHaveBeenCalledTimes(1)
    })
  
    test('Should notify when a key is cleaned', () => {
      const deleteHandler = jest.fn()
      const cleanHandler = jest.fn()

      const baseCache = new Cache<string, string>()
      const cache = new LruCache(baseCache, {maxSize: 1})

      const unsubscribeDelete = cache.on('delete', deleteHandler)
      const unsubscribeClean = cache.on('clean', cleanHandler)

      const key = 'key'
      const value = 'value'

      const key2 = 'key2'
      const value2 = 'value2'

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)

      cache.set(key2, value2)
      expect(cache.has(key2)).toBe(true)
      expect(cache.has(key)).toBe(false)
      expect(deleteHandler).toHaveBeenCalledWith(key)
      expect(deleteHandler).toHaveBeenCalledTimes(1)

      cache.clean()
      expect(deleteHandler).toHaveBeenCalledTimes(1)
      expect(cleanHandler).toHaveBeenCalledTimes(1)

      unsubscribeDelete()
      unsubscribeClean()
    })
  })
})
