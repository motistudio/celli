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
  })
})
