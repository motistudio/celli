import {describe, test, expect, vi} from 'vitest'

import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import EffectsCache from '../../../src/cache/implementations/EffectsCache'

describe('EffectsCache', () => {
  test('Should create a basic effects cache', () => {
    const cleanup = vi.fn(() => undefined)
    const effect = vi.fn(() => cleanup)
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
    const cleanup = vi.fn(() => undefined)
    const effect = vi.fn(() => cleanup)
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

  test('Should listen to effects cache events', () => {
    const getHandler = vi.fn()
    const setHandler = vi.fn()
    const deleteHandler = vi.fn()
    const cleanHandler = vi.fn()

    const cache = new EffectsCache(new Cache<string, string>(), [])

    const unsubscribeGet = cache.on('get', getHandler)
    const unsubscribeSet = cache.on('set', setHandler)
    const unsubscribeDelete = cache.on('delete', deleteHandler)
    const unsubscribeClean = cache.on('clean', cleanHandler)

    const key = 'key'
    const value = 'value'

    expect(cache.get(key)).toBe(undefined)
    expect(getHandler).toHaveBeenCalledTimes(1)
    expect(getHandler).toHaveBeenCalledWith(key)

    cache.set(key, value)
    expect(cache.get(key)).toBe(value)
    expect(getHandler).toHaveBeenCalledTimes(2)
    expect(setHandler).toHaveBeenCalledTimes(1)
    expect(setHandler.mock.calls.at(-1)).toMatchObject([key, value])

    cache.delete(key)
    expect(deleteHandler).toHaveBeenCalledTimes(1)
    expect(deleteHandler).toHaveBeenCalledWith(key)

    cache.clean()
    expect(cleanHandler).toHaveBeenCalledTimes(1)

    unsubscribeGet()
    unsubscribeSet()
    unsubscribeDelete()
    unsubscribeClean()

    cache.set(key, value)
    expect(setHandler).toHaveBeenCalledTimes(1)
    cache.get(key)
    expect(getHandler).toHaveBeenCalledTimes(2)
    cache.delete(key)
    expect(deleteHandler).toHaveBeenCalledTimes(1)
    cache.clean()
    expect(cleanHandler).toHaveBeenCalledTimes(1)
  })
})
