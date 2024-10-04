import {
  createCache,
  lru,
  async,
  lifeCycle,
  type Cache
} from '../../../src/lib'

describe('Creating and composing cache', () => {
  test('Should create a basic cache', () => {
    const cache = createCache()
    const key = 'k'
    const value = 'v'

    expect(cache.get(key)).toBe(undefined)
    expect(cache.has(key)).toBe(false)
    
    cache.set(key, value)
    
    expect(cache.get(key)).toBe(value)
    expect(cache.has(key)).toBe(true)
    
    cache.delete(key)

    expect(cache.get(key)).toBe(undefined)
    expect(cache.has(key)).toBe(false)
  })

  test('Should compose an async cache', async () => {
    const cache = async()(createCache())
    const key = 'k'
    const value = 'v'

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
    
    await cache.set(key, value)
    
    await expect(cache.get(key)).resolves.toBe(value)
    await expect(cache.has(key)).resolves.toBe(true)
    
    await cache.delete(key)

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
  })

  test('Should compose an lru cache', async () => {
    const asyncCache = async()(createCache<string, string>())
    const cache = lru({maxSize: 1})(asyncCache)
    const key = 'k'
    const value = 'v'

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
    
    await cache.set(key, value)
    
    await expect(cache.get(key)).resolves.toBe(value)
    await expect(cache.has(key)).resolves.toBe(true)
    
    await cache.delete(key)

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
  })

  test('Should compose a lifeCycle cache', () => {
    const lifeCycleCache = lifeCycle<Cache<string, string>>()(createCache<string, string>())
    const lruCache = lru<typeof lifeCycleCache>({maxSize: 2})(lifeCycleCache)

    const cleanup = jest.fn(() => undefined)
    const effect = jest.fn(() => {
      return cleanup
    })

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2'],
      ['k3', 'v3']
    ]

    lruCache.set(pairs[0][0], pairs[0][1], [effect])
    expect(lruCache.has(pairs[0][0])).toBe(true)

    lruCache.set(pairs[1][0], pairs[1][1], [effect])
    expect(lruCache.has(pairs[1][0])).toBe(true)

    lruCache.set(pairs[2][0], pairs[2][1], [effect])
    expect(lruCache.has(pairs[2][0])).toBe(true)

    expect(lruCache.has(pairs[0][0])).toBe(false) // been removed
    expect(cleanup).toHaveBeenCalled()

    lruCache.clean()
  })
})
