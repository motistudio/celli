import {describe, test, expect, vi, beforeEach, afterEach} from 'vitest'

import type {CacheManager} from '../../../src/types/cacheManager.t'

import Cache from '../../../src/decorators/cache'
import createCache from '../../../src/createCache'
import createCacheManager from '../../../src/createCacheManager'

describe('Cache decorator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Should cache a method', () => {
    const method = vi.fn((number: number) => ({value: number * 2}))

    class StaticClass {
      @Cache({cacheBy: (x) => String(x), async: false, lru: 2, ttl: 100})
      static expensiveMethod(x: number) {
        return method(x)
      }
    }

    // First call should compute
    const result1 = StaticClass.expensiveMethod(5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    // Second call with same argument should use cache
    const result2 = StaticClass.expensiveMethod(5)
    expect(result2).toBe(result1) // Same object reference
    expect(method).toHaveBeenCalledTimes(1)

    // Call with different argument should compute
    const result3 = StaticClass.expensiveMethod(10)
    expect(result3).toMatchObject({value: 20})
    expect(method).toHaveBeenCalledTimes(2)

    // Repeat call should use cache
    const result4 = StaticClass.expensiveMethod(10)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)

    // Testing LRU
    const result5 = StaticClass.expensiveMethod(15)
    expect(result5).toMatchObject({value: 30})
    expect(method).toHaveBeenCalledTimes(3)
    const result6 = StaticClass.expensiveMethod(5)
    // New result got calculated again
    expect(result6).toMatchObject(result1)
    expect(result6).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(4)

    // Wait for TTL to expire
    vi.advanceTimersByTime(101)

    // Call after TTL expiration should compute again
    const result7 = StaticClass.expensiveMethod(15)
    // was caclculated again:
    expect(result7).toMatchObject(result5)
    expect(result7).not.toBe(result5)
    expect(method).toHaveBeenCalledTimes(5)
  })

  test('Should cache an async method', async () => {
    const method = vi.fn((number: number) => Promise.resolve({value: number * 2}))

    class StaticClass {
      @Cache({cacheBy: (x) => String(x), async: true, lru: 2, ttl: 100})
      static expensiveMethod(x: number) {
        return method(x)
      }
    }

    // First call should compute
    const result1Promise = StaticClass.expensiveMethod(5)
    const result1Promise2 = StaticClass.expensiveMethod(5)
    expect(result1Promise).toBe(result1Promise2)
    const result1 = await result1Promise
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    // Second call with same argument should use cache
    const result2Promise = StaticClass.expensiveMethod(5)
    expect(result2Promise).not.toBe(result1Promise)
    const result2 = await result1Promise
    expect(result2).toBe(result1) // Same object reference
    expect(method).toHaveBeenCalledTimes(1)

    // Call with different argument should compute
    const result3 = await StaticClass.expensiveMethod(10)
    expect(result3).toMatchObject({value: 20})
    expect(method).toHaveBeenCalledTimes(2)

    // Repeat call should use cache
    const result4 = await StaticClass.expensiveMethod(10)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)

    // Testing LRU
    const result5 = await StaticClass.expensiveMethod(15)
    expect(result5).toMatchObject({value: 30})
    expect(method).toHaveBeenCalledTimes(3)
    const result6 = await StaticClass.expensiveMethod(5)
    // New result got calculated again
    expect(result6).toMatchObject(result1)
    expect(result6).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(4)

    // Wait for TTL to expire
    vi.advanceTimersByTime(101)

    // Call after TTL expiration should compute again
    const result7 = await StaticClass.expensiveMethod(15)
    // was caclculated again:
    expect(result7).toMatchObject(result5)
    expect(result7).not.toBe(result5)
    expect(method).toHaveBeenCalledTimes(5)
  })

  test('Should cache via external cache', () => {
    const context = {
      cache: createCache<string, {value: number}>()
    }

    const context2 = {
      cache: createCache<string, {value: number}>()
    }

    const method = vi.fn((number: number) => ({value: number * 2}))

    class StaticClass {
      @Cache({
        cacheBy: (x) => String(x),
        from: (context) => context.cache,
      })
      static expensiveMethod(c: typeof context, x: number) {
        return method(x)
      }
    }

    const result1 = StaticClass.expensiveMethod(context, 5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    const result2 = StaticClass.expensiveMethod(context, 5)
    expect(result2).toBe(result1)
    expect(method).toHaveBeenCalledTimes(1)

    const result3 = StaticClass.expensiveMethod(context2, 5)
    expect(result3).not.toBe(result1)
    expect(method).toHaveBeenCalledTimes(2)

    const result4 = StaticClass.expensiveMethod(context2, 5)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)
  })

  test('Should cache via external context', async () => {
    type Context = {
      cm: CacheManager
    }

    const context: Context = {
      cm: createCacheManager()
    }

    const context2: Context = {
      cm: createCacheManager()
    }

    const baseMethod = (number: number) => ({value: number * 2})

    const method = vi.fn(baseMethod)

    class StaticClass {
      @Cache({
        cacheBy: (x) => String(x),
        via: (context) => context.cm,
        async: false,
        lru: 2,
        ttl: 100
      })
      static expensiveMethod(c: Context, x: number) {
        return method(x)
      }
    }

    const result1 = StaticClass.expensiveMethod(context, 5)
    expect(result1).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    const result2 = StaticClass.expensiveMethod(context, 5)
    expect(result2).toBe(result1)
    expect(method).toHaveBeenCalledTimes(1)

    const result3 = StaticClass.expensiveMethod(context2, 5)
    expect(result3).toBe(result1) // they share the cache instance
    expect(method).toHaveBeenCalledTimes(1)

    const result4 = StaticClass.expensiveMethod(context2, 5)
    expect(result4).toBe(result3)
    expect(method).toHaveBeenCalledTimes(1)

    await context.cm.clear()

    // The results are still there, so long at least one context share this cache
    const result5 = StaticClass.expensiveMethod(context2, 5)
    expect(result5).toBe(result3)
    expect(method).toHaveBeenCalledTimes(1)

    await context2.cm.clear()

    // Now the results are gone
    const result6 = StaticClass.expensiveMethod(context2, 5)
    expect(result6).not.toBe(result3)
    expect(method).toHaveBeenCalledTimes(2)
  })

  test('Should receive an error if the cache applies to any non-method', () => {
    const method = vi.fn((x: number) => ({value: x * 2}))

    expect(() => {
      class SomeClass {
        @Cache<any>({async: false, ttl: 100, lru: 2})
        get value () {
          return method(5)
        }
      }
      new SomeClass()
    }).toThrow()
  })
})
