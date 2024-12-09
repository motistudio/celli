import globalCacheManager from '../../../src/lib/cacheManager'
import {clean, Cache, cache, createCacheManager} from '../../../src/index'

describe('Decorators', () => {
  test('Should cache a function', async () => {
    const method = jest.fn((number: number) => ({value: number * 2}))

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
    const method = jest.fn((number: number) => ({value: number * 2}))

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

    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod1)).toBeTruthy()
    expect(globalCacheManager.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod2)).toBe(undefined)

    expect(cm.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod1)).toBe(undefined) // Inherits from global
    expect(cm.getAllResourceEntries().find(([, fn]) => fn === expensiveMethod2)).toBeTruthy()
  })
})
