import {describe, test, expect, vi} from 'vitest'

import getGlobalCacheManager from '../../../src/lib/getGlobalCacheManager'
import {clean, Cache, cache, createCacheManager, type Cleanable} from '../../../src/index'

describe('Decorators', () => {
  test('Should cache a function', async () => {
    const method = vi.fn((number: number) => ({value: number * 2}))

    class StaticClass {
      @Cache({cacheBy: (x) => String(x), async: false, lru: 2, ttl: 100})
      static expensiveMethod(x: number) {
        return method(x)
      }
    }

    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    await clean()
    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(2)
  })

  test('Should cache a function without registering it to the global CacheManager', async () => {
    const method = vi.fn((number: number) => ({value: number * 2}))

    const globalCacheManager = getGlobalCacheManager()
    const cm = createCacheManager()

    const context = {
      cm
    }

    const expensiveMethod1 = cache(method, {
      cacheBy: (x) => String(x),
      async: false,
      lru: 2,
      ttl: 100
    })

    const expensiveMethod2 = cache((ctx: (typeof context), x: number) => method(x), {
      cacheBy: (ctx, x) => String(x),
      via: ctx => ctx.cm,
      async: false,
      lru: 2,
      ttl: 100
    })

    // Trigger the cache since the registration is dynamic
    expect(expensiveMethod2(context, 5)).toMatchObject({value: 10})

    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod1)).toBeTruthy()
    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod2)).toBe(undefined)

    expect(cm.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod1)).toBe(undefined) // Inherits from global
    expect(cm.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod2)).toBeTruthy()
  })

  test('Should cache a method without registering it to the global CacheManager', async () => {
    const method = vi.fn((number: number) => ({value: number * 2}))

    const globalCacheManager = getGlobalCacheManager()
    const cm = createCacheManager()

    const context = {
      cm
    }

    class StaticClass {
      @Cache({
        cacheBy: (x) => String(x),
        async: false,
        lru: 2,
        ttl: 100
      })
      static expensiveMethod(x: number) {
        return method(x)
      }
    }

    class StaticClass2 {
      @Cache({
        cacheBy: (ctx, x) => String(x),
        via: (ctx) => ctx.cm,
        async: false,
        lru: 2,
        ttl: 100,
      })
      static expensiveMethod(ctx: (typeof context), x: number) {
        return method(x)
      }
    }

    // Trigger the cache since the registration is dynamic
    expect(StaticClass2.expensiveMethod(context, 5)).toMatchObject({value: 10})

    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === StaticClass.expensiveMethod as unknown as Cleanable)).toBeTruthy()
    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === StaticClass2.expensiveMethod as unknown as Cleanable)).toBe(undefined)

    expect(cm.getAllResourceEntries().find(([, fn]) => fn === StaticClass.expensiveMethod as unknown as Cleanable)).toBe(undefined) // Inherits from global
    expect(cm.getAllResourceEntries().find(([, fn]) => fn === StaticClass2.expensiveMethod as unknown as Cleanable)).toBeTruthy()
  })
})
