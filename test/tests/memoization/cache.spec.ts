import type {AnyCacheType} from '../../../src/types/cache.t'
import type {CacheManager} from '../../../src/types/cacheManager.t'

import createCache from '../../../src/cache/create'
import createCacheManager from '../../../src/createCacheManager'
import cache from '../../../src/memoization/cache'

describe('Universal cache utility', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('Should memoize a function', () => {
    const method = jest.fn((number: number) => ({value: number * 2}))

    const expensiveMethod = cache(method, {cacheBy: (x) => String(x), async: false, lru: 2, ttl: 100})

    // First call should compute
    const result1 = expensiveMethod(5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    // Second call with same argument should use cache
    const result2 = expensiveMethod(5)
    expect(result2).toBe(result1) // Same object reference
    expect(method).toHaveBeenCalledTimes(1)

    // Call with different argument should compute
    const result3 = expensiveMethod(10)
    expect(result3).toMatchObject({value: 20})
    expect(method).toHaveBeenCalledTimes(2)

    // Repeat call should use cache
    const result4 = expensiveMethod(10)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)

    // Testing LRU
    const result5 = expensiveMethod(15)
    expect(result5).toMatchObject({value: 30})
    expect(method).toHaveBeenCalledTimes(3)
    const result6 = expensiveMethod(5)
    // New result got calculated again
    expect(result6).toMatchObject(result1)
    expect(result6).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(4)

    // Wait for TTL to expire
    jest.advanceTimersByTime(101)

    // Call after TTL expiration should compute again
    const result7 = expensiveMethod(15)
    // was caclculated again:
    expect(result7).toMatchObject(result5)
    expect(result7).not.toBe(result5)
    expect(method).toHaveBeenCalledTimes(5)
  })

  test('Should cache an async method', async () => {
    const method = jest.fn((number: number) => Promise.resolve({value: number * 2}))

    const expensiveMethod = cache(method, {cacheBy: (x) => String(x), async: true, lru: 2, ttl: 100})

    // First call should compute
    const result1Promise = expensiveMethod(5)
    const result1Promise2 = expensiveMethod(5)
    expect(result1Promise).toBe(result1Promise2)
    const result1 = await result1Promise
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    // Second call with same argument should use cache
    const result2Promise = expensiveMethod(5)
    expect(result2Promise).not.toBe(result1Promise)
    const result2 = await result1Promise
    expect(result2).toBe(result1) // Same object reference
    expect(method).toHaveBeenCalledTimes(1)

    // Call with different argument should compute
    const result3 = await expensiveMethod(10)
    expect(result3).toMatchObject({value: 20})
    expect(method).toHaveBeenCalledTimes(2)

    // Repeat call should use cache
    const result4 = await expensiveMethod(10)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)

    // Testing LRU
    const result5 = await expensiveMethod(15)
    expect(result5).toMatchObject({value: 30})
    expect(method).toHaveBeenCalledTimes(3)
    const result6 = await expensiveMethod(5)
    // New result got calculated again
    expect(result6).toMatchObject(result1)
    expect(result6).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(4)

    // Wait for TTL to expire
    jest.advanceTimersByTime(101)

    // Call after TTL expiration should compute again
    const result7 = await expensiveMethod(15)
    // was caclculated again:
    expect(result7).toMatchObject(result5)
    expect(result7).not.toBe(result5)
    expect(method).toHaveBeenCalledTimes(5)
  })

  test('Should cache via external cache', () => {
    type Context = {
      cache: AnyCacheType<string, {value: number}>
    }

    const context: Context = {
      cache: createCache<string, {value: number}>()
    }

    const context2: Context = {
      cache: createCache<string, {value: number}>()
    }

    const method = jest.fn((context: Context, number: number) => ({value: number * 2}))

    const expensiveMethod = cache(method, {cacheBy: (context, x) => String(x), from: (context) => context.cache})

    const result1 = expensiveMethod(context, 5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    const result2 = expensiveMethod(context, 5)
    expect(result2).toBe(result1)
    expect(method).toHaveBeenCalledTimes(1)

    const result3 = expensiveMethod(context2, 5)
    expect(result3).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(2)

    const result4 = expensiveMethod(context2, 5)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)
  })

  test('Should cache via external CacheManager', async () => {
    type Context = {
      cm: CacheManager
    }

    const context: Context = {
      cm: createCacheManager()
    }

    const context2: Context = {
      cm: createCacheManager()
    }

    const baseMethod = (context: Context, number: number) => ({value: number * 2})

    const method = jest.fn(baseMethod)

    const expensiveMethod = cache<typeof baseMethod>(method, {
      cacheBy: (context, x) => String(x),
      via: (context) => context.cm,
      async: false,
      lru: 2,
      ttl: 100
    })

    const result1 = expensiveMethod(context, 5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    const result2 = expensiveMethod(context, 5)
    expect(result2).toBe(result1)
    expect(method).toHaveBeenCalledTimes(1)

    const result3 = expensiveMethod(context2, 5)
    expect(result3).toBe(result1) // they share the cache instance
    expect(method).toHaveBeenCalledTimes(1)

    const result4 = expensiveMethod(context2, 5)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(1)

    await context.cm.clear()

    // The results are still there, so long at least one context share this cache
    const result5 = expensiveMethod(context2, 5)
    expect(result5).toBe(result3)
    expect(method).toHaveBeenCalledTimes(1)

    await context2.cm.clear()

    // Now the results are gone
    const result6 = expensiveMethod(context2, 5)
    expect(result6).not.toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)
  })

  test('Should cache via external CacheManager with default cacheBy', async () => {
    type Context = {
      cm: CacheManager
    }

    const context: Context = {
      cm: createCacheManager()
    }

    const baseMethod = (context: Context, number: number) => ({value: number * 2})

    const method = jest.fn(baseMethod)

    const expensiveMethod = cache<typeof baseMethod>(method, {
      via: (context) => context.cm,
      async: false,
      lru: 2,
      ttl: 100
    })

    const result1 = expensiveMethod(context, 5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    const result2 = expensiveMethod(context, 5)
    expect(result2).toBe(result1)
    expect(method).toHaveBeenCalledTimes(1)
  })
})
