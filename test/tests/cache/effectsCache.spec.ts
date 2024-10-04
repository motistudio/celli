import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import EffectsCache from '../../../src/cache/implementations/EffectsCache'

describe('EffectsCache', () => {
  test('Should create a basic effects cache', () => {
    const cleanup = jest.fn(() => undefined)
    const effect = jest.fn(() => cleanup)
    const effectsCache = new EffectsCache(new Cache<string, string>(), [effect])

    const key = 'k1'
    const key2 = 'k2'
    const value = 'v1'
    const value2 = 'v2'

    effectsCache.set(key, value)
    expect(effectsCache.has(key)).toBe(true)
    expect(effectsCache.get(key)).toBe(value)
    expect(effect).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(0)

    effectsCache.set(key2, value2)
    expect(effectsCache.has(key2)).toBe(true)
    expect(effectsCache.get(key2)).toBe(value2)
    expect(effect).toHaveBeenCalledTimes(2)
    expect(cleanup).toHaveBeenCalledTimes(0)

    expect(Array.from(effectsCache.keys())).toMatchObject([key, key2])
    expect(Array.from(effectsCache.values())).toMatchObject([value, value2])
    expect(Array.from(effectsCache.entries())).toMatchObject([[key, value], [key2, value2]])
    expect(Array.from(effectsCache)).toMatchObject([[key, value], [key2, value2]])
    
    // override
    effectsCache.set(key, value)
    expect(effectsCache.has(key)).toBe(true)
    expect(effectsCache.get(key)).toBe(value)
    expect(effect).toHaveBeenCalledTimes(3)
    expect(cleanup).toHaveBeenCalledTimes(1)

    effectsCache.delete(key)
    expect(effectsCache.has(key)).toBe(false)
    expect(cleanup).toHaveBeenCalledTimes(2)
    
    effectsCache.clean()
    expect(cleanup).toHaveBeenCalledTimes(3)
  })

  test('Should create a cache with no effects, it\'s also fine', () => {
    const effectsCache = new EffectsCache(new Cache<string, string>())

    const key = 'key'
    const value = 'value'
    
    effectsCache.set(key, value)
    expect(effectsCache.has(key)).toBe(true)
    expect(effectsCache.get(key)).toBe(value)

    effectsCache.delete(key)
    expect(effectsCache.has(key)).toBe(false)
  })

  test('Should create an async EffectsCache', async () => {
    const cleanup = jest.fn(() => undefined)
    const effect = jest.fn(() => cleanup)
    const effectsCache = new EffectsCache(new AsyncCache<string, string>(), [effect])

    const key = 'k1'
    const key2 = 'k2'
    const value = 'v1'
    const value2 = 'v2'

    await effectsCache.set(key, value)
    await expect(effectsCache.has(key)).resolves.toBe(true)
    await expect(effectsCache.get(key)).resolves.toBe(value)
    expect(effect).toHaveBeenCalledTimes(1)
    expect(cleanup).toHaveBeenCalledTimes(0)

    await effectsCache.set(key2, value2)
    await expect(effectsCache.has(key2)).resolves.toBe(true)
    await expect(effectsCache.get(key2)).resolves.toBe(value2)
    expect(effect).toHaveBeenCalledTimes(2)
    expect(cleanup).toHaveBeenCalledTimes(0)

    await expect(Array.fromAsync(effectsCache.keys())).resolves.toMatchObject([key, key2])
    await expect(Array.fromAsync(effectsCache.values())).resolves.toMatchObject([value, value2])
    await expect(Array.fromAsync(effectsCache.entries())).resolves.toMatchObject([[key, value], [key2, value2]])
    await expect(Array.fromAsync(effectsCache)).resolves.toMatchObject([[key, value], [key2, value2]])
    
    // override
    await effectsCache.set(key, value)
    await expect(effectsCache.has(key)).resolves.toBe(true)
    await expect(effectsCache.get(key)).resolves.toBe(value)
    expect(effect).toHaveBeenCalledTimes(3)
    expect(cleanup).toHaveBeenCalledTimes(1)

    await effectsCache.delete(key)
    await expect(effectsCache.has(key)).resolves.toBe(false)
    expect(cleanup).toHaveBeenCalledTimes(2)
    
    await effectsCache.clean()
    expect(cleanup).toHaveBeenCalledTimes(3)
  })
})
