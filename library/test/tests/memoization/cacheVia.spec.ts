import {describe, test, expect} from 'vitest'

import type {CacheManager} from '../../../src/types/cacheManager.t'

import createCacheManager from '../../../src/createCacheManager'
import cacheVia from '../../../src/memoization/cacheVia'

describe('cacheVia', () => {
  test('Should memoize via a cache manager', async () => {
    type Result = {x: number}
    type Context = {cm: CacheManager}

    const cacheManager = createCacheManager()
    const cacheManager2 = createCacheManager()
    const context = {cm: cacheManager}
    const context2 = {cm: cacheManager2}

    const getResult = (context: Context, x: number): Result => ({x})

    const memoized = cacheVia(getResult, (context, x) => String(x), (context) => context.cm)

    const result1 = memoized(context, 1)
    expect(result1).toMatchObject({x: 1})
    const result2 = memoized(context, 1)
    expect(result2).toBe(result1)

    const result3 = memoized(context2, 1)
    expect(result3).toMatchObject({x: 1})
    const result4 = memoized(context2, 1)
    expect(result4).toBe(result3)
    expect(result4).toBe(result2) // Cache is shared between instances

    await cacheManager.clear()

    // Results are still there
    const result5 = memoized(context2, 1)
    expect(result5).toMatchObject({x: 1})
    const result6 = memoized(context2, 1)
    expect(result6).toBe(result5)
    expect(result5).toBe(result1)

    await cacheManager2.clear()

    // Only now we get different results
    const result7 = memoized(context, 1)
    expect(result7).toMatchObject({x: 1})
    expect(result7).not.toBe(result5)

    await memoized.clean()

    // Different results again after manual clean
    const result8 = memoized(context, 1)
    expect(result8).toMatchObject({x: 1})
    expect(result8).not.toBe(result7)
  })
})
