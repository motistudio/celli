import isThentable from '../../../src/commons/promise/isThentable'
import createCache from '../../../src/memoization/cache'

describe('Cache creation', () => {
  jest.useFakeTimers()

  afterEach(() => {
    jest.runAllTimers()
  })

  test('Should create a simple synchronous cache', () => {
    const cache = createCache()

    const key = 'key'
    const value = 'value'

    expect(isThentable(cache.set(key, value))).toBe(false)
    expect(cache.get(key)).toBe(value)
  })

  test('Should create an async cache', async () => {
    const cache = createCache({async: true})
    
    const key = 'key'
    const value = 'value'

    const setPromise = cache.set(key, value)
    expect(isThentable(setPromise)).toBe(true)
    await setPromise
    await expect(cache.get(key)).resolves.toBe(value)
  })

  test.each([createCache({lru: 1}), createCache({lru: {maxSize: 1}})])('Should create a cache with built-in lru', async (cache) => {
    const key = 'key'
    const value = 'value'
    
    const key2 = 'key2'
    const value2 = 'value2'

    cache.set(key, value)
    expect(cache.has(key)).toBe(true)
    cache.set(key2, value2)
    expect(cache.has(key2)).toBe(true)
    expect(cache.has(key)).toBe(false)
  })

  test('Should create a cache with built-in ttl', () => {
    const cache = createCache({ttl: 1000})

    const key = 'key'
    const value = 'value'

    cache.set(key, value)
    expect(cache.has(key)).toBe(true)
    
    jest.advanceTimersByTime(1001)
    expect(cache.has(key)).toBe(false)
  })

  test('Should create a cache with a source', async () => {
    const source = createCache({async: true})
    const cache = createCache({source})

    const key = 'key'
    const value = 'value'

    await source.set(key, value)
    await expect(cache.get(key)).resolves.toBe(value)
  })
})