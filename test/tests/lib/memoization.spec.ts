import {
  memo,
  cacheWith,
  createCache,
  once,
  type AnyCacheType
} from '../../../src/index'

describe('Memoization', () => {
  test('Should memoize a function', async () => {
    const fn = jest.fn(() => 'v')
    const memoized = memo(fn)

    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('Should memoize a function by context', () => {
    const context = {cache: createCache({
      async: false,
      lru: 100,
      ttl: 1000
    })}

    const context2 = {cache: createCache({
      async: false,
      lru: 100,
      ttl: 1000
    })}

    const fn = jest.fn((context: {cache: AnyCacheType<any, any>}, a: number) => a)
    const memoized = cacheWith(fn, {by: (context, a) => String(a), from: (context) => context.cache})

    expect(memoized(context, 1)).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(memoized(context, 1)).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized(context2, 1)).toBe(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(memoized(context2, 1)).toBe(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('Should memoize a function to run once', () => {
    const fn = jest.fn(() => 'v')
    const memoized = once(fn)

    expect(memoized()).toBe('v')
    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
