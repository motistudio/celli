import {describe, test, expect} from 'vitest'

import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import cacheWith from '../../../src/memoization/cacheWith'
import cleanRefKeys from '../../../src/memoization/cacheWith/cleanRefKeys'

describe('CacheWith', () => {
  test('Should cache a function dynamically', () => {
    type Result = {x: number}
    type Context = {cache: Cache<string, Result>}

    const getResult = (context: Context, x: number): Result => ({x})

    const cache1 = new Cache<string, Result>()
    const cache2 = new Cache<string, Result>()

    const context1 = {cache: cache1}
    const context2 = {cache: cache2}

    const memoized = cacheWith(getResult, {
      by: (context, x) => String(x),
      from: (context) => context.cache
    })

    const context1Result = memoized(context1, 1)
    expect(context1Result).toMatchObject({x: 1})
    const context1Result2 = memoized(context1, 1)
    expect(context1Result2).toBe(context1Result)
    const context1Result3 = memoized(context1, 3)
    expect(context1Result3).not.toBe(context1Result)
    expect(context1Result3).toMatchObject({x: 3})

    // proof of cache
    expect(cache1.get('1')).toBe(context1Result)
    expect(cache2.get('1')).toBe(undefined)

    // memo of different cache
    const context2Result = memoized(context2, 1)
    expect(context2Result).toMatchObject({x: 1})
    expect(context2Result).not.toBe(context1Result)
    const context2Result2 = memoized(context2, 1)
    expect(context2Result2).toBe(context2Result)
  })

  test('Should cache an async function dynamically', async () => {
    type Result = {x: number}
    type Context = {cache: AsyncCache<string, Result>}

    const getResult = (context: Context, x: number): Promise<Result> => Promise.resolve({x})

    const cache1 = new AsyncCache<string, Result>()
    const cache2 = new AsyncCache<string, Result>()

    const context1 = {cache: cache1}
    const context2 = {cache: cache2}

    const memoized = cacheWith(getResult, {
      by: (context, x) => String(x),
      from: (context) => context.cache
    })

    const context1ResultPromise = memoized(context1, 1)
    const context1ResultPromise2 = memoized(context1, 1)
    expect(context1ResultPromise2).toBe(context1ResultPromise)

    const context1Result = await context1ResultPromise
    expect(context1Result).toMatchObject({x: 1})

    const context1Result2Promise = memoized(context1, 1)
    const context1Result2Promise2 = memoized(context1, 1)
    expect(context1Result2Promise2).toBe(context1Result2Promise)
    expect(context1Result2Promise2).not.toBe(context1ResultPromise)

    const context1Result2 = await context1Result2Promise
    expect(context1Result2).toBe(context1Result)
    const context1Result3 = await memoized(context1, 3)
    expect(context1Result3).not.toBe(context1Result)
    expect(context1Result3).toMatchObject({x: 3})

    // proof of cache
    await expect(cache1.get('1')).resolves.toBe(context1Result)
    await expect(cache2.get('1')).resolves.toBe(undefined)

    // memo of different cache
    const context2ResultPromise = memoized(context2, 1)
    const context2ResultPromise2 = memoized(context2, 1)
    const context2ResultPromiseForContext1 = memoized(context1, 1)
    expect(context2ResultPromise).toBe(context2ResultPromise2)
    expect(context2ResultPromise).not.toBe(context2ResultPromiseForContext1)

    const context2Result = await context2ResultPromise
    expect(context2Result).toMatchObject({x: 1})
    expect(context2Result).not.toBe(context1Result)
    const context2Result2 = await memoized(context2, 1)
    expect(context2Result2).toBe(context2Result)
  })

  describe('Cleanup', () => {
    test('Should clean keys of a refs set', () => {
      const keySet = new Set<WeakRef<object>>()
      const obj1 = {}
      const obj2 = {}
      const obj3 = {}

      keySet.add(new WeakRef(obj1))
      keySet.add(new WeakRef(obj2))
      keySet.add(new WeakRef(obj3))

      expect(keySet.size).toBe(3)

      // Simulate obj2 being garbage collected
      const weakRef2 = Array.from(keySet)[1]
      Object.defineProperty(weakRef2, 'deref', {value: () => undefined})

      cleanRefKeys(keySet)

      expect(keySet.size).toBe(2)
      expect(Array.from(keySet).some(ref => ref.deref() === obj1)).toBe(true)
      expect(Array.from(keySet).some(ref => ref.deref() === obj3)).toBe(true)
      expect(Array.from(keySet).some(ref => ref.deref() === obj2)).toBe(false)
    })

    test('Should clean cached results', async () => {
      type Result = {x: number}
      type Context = {cache: AsyncCache<string, Result>}

      const getResult = (context: Context, x: number): Promise<Result> => Promise.resolve({x})

      const memoized = cacheWith(getResult, {
        by: (context, x) => String(x),
        from: (context) => context.cache
      })

      const cache1 = new AsyncCache<string, Result>()
      const cache2 = new AsyncCache<string, Result>()

      const context1 = {cache: cache1}
      const context2 = {cache: cache2}

      await memoized(context1, 1)
      await memoized(context2, 1)
      await memoized(context1, 2)
      await memoized(context2, 2)

      await expect(cache1.has('1')).resolves.toBe(true)
      await expect(cache2.has('1')).resolves.toBe(true)
      await expect(cache1.has('2')).resolves.toBe(true)
      await expect(cache2.has('2')).resolves.toBe(true)

      await memoized.clean()

      await expect(cache1.has('1')).resolves.toBe(false)
      await expect(cache2.has('1')).resolves.toBe(false)
      await expect(cache1.has('2')).resolves.toBe(false)
      await expect(cache2.has('2')).resolves.toBe(false)
    })

    test('Should clean sync cached results', () => {
      type Result = {x: number}
      type Context = {cache: Cache<string, Result>}

      const getResult = (context: Context, x: number): Result => ({x})

      const memoized = cacheWith(getResult, {
        by: (context, x) => String(x),
        from: (context) => context.cache
      })

      const cache1 = new Cache<string, Result>()
      const cache2 = new Cache<string, Result>()

      const context1 = {cache: cache1}
      const context2 = {cache: cache2}

      memoized(context1, 1)
      memoized(context2, 1)
      memoized(context1, 2)
      memoized(context2, 2)

      expect(cache1.has('1')).toBe(true)
      expect(cache2.has('1')).toBe(true)
      expect(cache1.has('2')).toBe(true)
      expect(cache2.has('2')).toBe(true)

      const result = memoized.clean()

      // Sync clean should return undefined (not a Promise)
      expect(result).toBe(undefined)

      expect(cache1.has('1')).toBe(false)
      expect(cache2.has('1')).toBe(false)
      expect(cache1.has('2')).toBe(false)
      expect(cache2.has('2')).toBe(false)
    })

    // Tests for mocking failure on garbage collected cache refs, mainly for the coverage:
    test('Should skip cleanup for garbage collected cache refs', () => {
      type Result = {x: number}
      type Context = {cache: Cache<string, Result>}

      const getResult = (context: Context, x: number): Result => ({x})

      const memoized = cacheWith(getResult, {
        by: (context, x) => String(x),
        from: (context) => context.cache
      })

      const cache1 = new Cache<string, Result>()
      const cache2 = new Cache<string, Result>()

      memoized({cache: cache1}, 1)
      memoized({cache: cache2}, 1)

      expect(cache1.has('1')).toBe(true)
      expect(cache2.has('1')).toBe(true)

      // Simulate cache1's WeakRef being garbage collected
      // by mocking deref on specific WeakRef instances
      const keySet = new Set<WeakRef<object>>()
      const ref1 = new WeakRef(cache1)
      const ref2 = new WeakRef(cache2)

      // Mock deref to return undefined for first ref (simulating GC)
      Object.defineProperty(ref1, 'deref', {value: () => undefined})

      keySet.add(ref1)
      keySet.add(ref2)

      // Clean the refs - should skip the GC'd one
      cleanRefKeys(keySet)

      expect(keySet.size).toBe(1)
      // Only cache2's ref should remain
      expect(Array.from(keySet)[0].deref()).toBe(cache2)
    })

    test('Should handle cleanup when memoized instance is not found', () => {
      type Result = {x: number}
      type Context = {cache: Cache<string, Result>}

      const getResult = (context: Context, x: number): Result => ({x})

      const memoized = cacheWith(getResult, {
        by: (context, x) => String(x),
        from: (context) => context.cache
      })

      // Call clean without ever memoizing anything
      // This tests the case where keySet is empty
      const result = memoized.clean()
      expect(result).toBe(undefined)
    })

    test('Should skip cleanup when cache exists but memoized instance is missing from WeakMap', () => {
      type Result = {x: number}

      const mockCache = new Cache<string, Result>()
      const getResult = (_cache: Cache<string, Result>, x: number): Result => ({x})

      // Intercept WeakMap to simulate missing memoized instance
      const originalWeakMapGet = WeakMap.prototype.get
      const originalWeakMapSet = WeakMap.prototype.set
      let interceptedWeakMap: WeakMap<object, unknown> | null = null

      WeakMap.prototype.set = function(key, value) {
        interceptedWeakMap = this
        return originalWeakMapSet.call(this, key, value)
      }

      const memoized = cacheWith(getResult, {
        by: (_cache, x) => String(x),
        from: (cache) => cache
      })

      // Call the function to register the cache
      memoized(mockCache, 1)
      expect(mockCache.has('1')).toBe(true)

      // Delete the memoized instance from the WeakMap to simulate the missing case
      if (interceptedWeakMap) {
        (interceptedWeakMap as WeakMap<object, unknown>).delete(mockCache)
      }

      // Now mock get to return undefined for this specific cache
      WeakMap.prototype.get = function(key) {
        if (key === mockCache) {
          return undefined
        }
        return originalWeakMapGet.call(this, key)
      }

      // Clean should handle the missing memoized instance gracefully
      const result = memoized.clean()
      expect(result).toBe(undefined)

      // Restore WeakMap methods
      WeakMap.prototype.get = originalWeakMapGet
      WeakMap.prototype.set = originalWeakMapSet

      // Cache wasn't cleaned because the memoized instance wasn't found
      expect(mockCache.has('1')).toBe(true)
    })

    test('Should skip cleanup when cache deref returns undefined (GC scenario)', () => {
      type Result = {x: number}

      // Create a custom cache-like object
      const mockCache = new Cache<string, Result>()

      const getResult = (_cache: Cache<string, Result>, x: number): Result => ({x})

      // We need to intercept WeakRef creation to simulate GC
      const originalWeakRef = globalThis.WeakRef
      let weakRefInstance: WeakRef<any> | null = null

      // @ts-expect-error - mocking WeakRef
      globalThis.WeakRef = class MockWeakRef<T extends object> {
        private target: T | undefined
        constructor(target: T) {
          this.target = target
          weakRefInstance = this as unknown as WeakRef<any>
        }
        deref(): T | undefined {
          return this.target
        }
      }

      const memoized = cacheWith(getResult, {
        by: (_cache, x) => String(x),
        from: (cache) => cache
      })

      // Call the function to register the cache
      memoized(mockCache, 1)
      expect(mockCache.has('1')).toBe(true)

      // Now simulate GC by making deref return undefined
      if (weakRefInstance) {
        Object.defineProperty(weakRefInstance, 'deref', {value: () => undefined})
      }

      // Clean should handle the undefined deref gracefully
      const result = memoized.clean()
      expect(result).toBe(undefined)

      // Restore WeakRef
      globalThis.WeakRef = originalWeakRef

      // Cache wasn't cleaned because the ref was "garbage collected"
      expect(mockCache.has('1')).toBe(true)
    })
  })
})
