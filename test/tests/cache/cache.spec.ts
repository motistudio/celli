import isThentable from '../../../src/commons/promise/isThentable'
import createCache from '../../../src/createCache'

describe('Cache creation', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runAllTimers()
  })
  afterAll(() => {
    jest.useRealTimers()
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

  test('Should create a cache with effects', () => {
    const cleanup = jest.fn()
    const effect = jest.fn(() => cleanup)
    const cache = createCache({effects: [effect]})

    const key = 'key'
    const value = 'value'

    cache.set(key, value)
    expect(effect).toHaveBeenCalledTimes(1)
    cache.delete(key)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  describe('Dispose behavior', () => {
    test('Should create a cache with a dispose function', () => {
      const dispose = jest.fn()
      const cache = createCache({dispose})

      const key = 'key'
      const value = 'value'
      const value2 = 'value2'

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)
      cache.delete(key)
      expect(cache.has(key)).toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)
      cache.clean()
      expect(cache.has(key)).toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(2)

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)
      cache.set(key, value2)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(3)
    })

    test('Should create an async cache with a dispose function', async () => {
      const dispose = jest.fn()
      const cache = createCache({dispose, async: true})

      const key = 'key'
      const value = 'value'
      const value2 = 'value2'

      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)
      await cache.delete(key)
      await expect(cache.has(key)).resolves.toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)

      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)
      await cache.clean()
      await expect(cache.has(key)).resolves.toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(2)

      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)
      await cache.set(key, value2)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(3)
    })

    test('Should dispose with ttl', () => {
      const dispose = jest.fn()
      const cache = createCache({dispose, ttl: 100})

      const key = 'key'
      const value = 'value'

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)

      jest.advanceTimersByTime(101) // essentially delete

      expect(cache.has(key)).toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)
    })

    test('Should dispose with async ttl', async () => {
      const dispose = jest.fn()
      const cache = createCache({dispose, ttl: 100, async: true})

      const key = 'key'
      const value = 'value'

      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)

      jest.advanceTimersByTime(101) // essentially delete

      await expect(cache.has(key)).resolves.toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)
    })

    test('Should dispose with lru', () => {
      const dispose = jest.fn()
      const cache = createCache({dispose, lru: 1})

      const key = 'key'
      const value = 'value'

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)

      const key2 = 'key2'
      const value2 = 'value2'

      cache.set(key2, value2)

      expect(cache.has(key)).toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)
    })

    test('Should dispose with async lru', async () => {
      const dispose = jest.fn()
      const cache = createCache({dispose, lru: 1, async: true})

      const key = 'key'
      const value = 'value'

      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)

      const key2 = 'key2'
      const value2 = 'value2'

      await cache.set(key2, value2)

      await expect(cache.has(key)).resolves.toBe(false)
      expect(dispose).toHaveBeenCalledWith(value)
      expect(dispose).toHaveBeenCalledTimes(1)
    })
  })
})
