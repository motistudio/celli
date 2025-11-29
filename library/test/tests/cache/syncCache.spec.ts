import {describe, test, expect, vi} from 'vitest'

import Cache from '../../../src/cache/implementations/Cache'

describe('Synchronous cache', () => {
  test('Should create a simple cache', () => {
    const cache = new Cache()

    const key = 'k'
    const value = 'val'
    const value2 = 'val2'

    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)

    cache.set(key, value)

    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value)

    cache.set(key, value2)
    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value2)

    cache.delete(key)
    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)
  })

  test('Should get key and values', () => {
    const cache = new Cache()

    const entrySet = [['k1', 'v1'], ['k2', 'v2'], ['k3', 'v3']]

    entrySet.forEach(([key, value]) => {
      cache.set(key, value)
    })

    const keys = cache.keys()
    const values = cache.values()
    const entries = cache.entries()

    expect(keys.next).toBeTruthy()
    expect(values.next).toBeTruthy()
    expect(entries.next).toBeTruthy()

    expect(Array.from(keys)).toMatchObject(entrySet.map(([key]) => key))
    expect(Array.from(values)).toMatchObject(entrySet.map(([, value]) => value))
    expect(Array.from(entries)).toMatchObject(entrySet)
    expect(Array.from(cache)).toMatchObject(entrySet)
  })

  test.each([new Cache(), new Cache(new Cache())])('Should get cache cleaned', (cache) => {
    const values = {x: 1, y: 2, z: 3}
    Object.entries(values).forEach(([key, value]) => cache.set(key, value))

    expect(Object.keys(values).every((key) => cache.has(key))).toBe(true)

    cache.clean()

    expect(Object.keys(values).every((key) => !cache.has(key))).toBe(true)
  })

  test('Should listen to cache events', () => {
    const getHandler = vi.fn()
    const setHandler = vi.fn()
    const deleteHandler = vi.fn()
    const cleanHandler = vi.fn()

    const cache = new Cache<string, string>()

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
  
  test('Should clean cache when disposed', () => {
    const cache = new Cache<string, string>()

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(true)

    cache[Symbol.dispose]()

    expect(cache.has('key1')).toBe(false)
    expect(cache.has('key2')).toBe(false)
  })

  test('Should emit clean event when disposed', () => {
    const cleanHandler = vi.fn()
    const cache = new Cache<string, string>()

    cache.on('clean', cleanHandler)
    cache.set('key', 'value')

    cache[Symbol.dispose]()

    expect(cleanHandler).toHaveBeenCalledTimes(1)
  })
})
