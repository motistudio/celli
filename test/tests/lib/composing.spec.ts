import {createCache, lru, async} from '../../../src/lib'

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
})
