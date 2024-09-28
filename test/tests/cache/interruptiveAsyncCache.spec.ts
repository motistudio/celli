import {
  GET_PROMISES_KEY,
  SET_PROMISES_KEY,
  HAS_PROMISES_KEY,
  DELETE_PROMISES_KEY
} from '../../../src/cache/constants'
import InterruptiveAsyncCache from '../../../src/cache/InterruptiveAsyncCache'
import delay from '../../../src/commons/promise/delay'

import createAbstractAsyncCache from '../../utils/createAbstractAsyncCache'

describe('Interruptive Asynchronous Cache', () => {
  test.each([new InterruptiveAsyncCache<string, any>(), new InterruptiveAsyncCache<string, any>(new InterruptiveAsyncCache)])('Should create a simple async cache', async (cache) => {
    const key = 'k'
    const value = 'val'
    const value2 = 'val2'

    await expect(cache.has(key)).resolves.toBe(false)
    expect(cache[HAS_PROMISES_KEY].get(key)).toBe(undefined)
    await expect(cache.get(key)).resolves.toBe(undefined)
    expect(cache[GET_PROMISES_KEY].get(key)).toBe(undefined)
    
    await cache.set(key, value)
    expect(cache[SET_PROMISES_KEY].get(key)).toBe(undefined)
    
    await expect(cache.has(key)).resolves.toBe(true)
    await expect(cache.get(key)).resolves.toBe(value)
    
    await cache.set(key, value2)
    await expect(cache.has(key)).resolves.toBe(true)
    await expect(cache.get(key)).resolves.toBe(value2)
    
    await cache.delete(key)
    expect(cache[DELETE_PROMISES_KEY].get(key)).toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)
  })

  test('Should cache delete calls', async () => {
    const cache = new InterruptiveAsyncCache()

    const key = 'key'

    const deletePromise = cache.delete(key)
    const deletePromise2 = cache.delete(key)

    expect(deletePromise).toBe(deletePromise2)

    await deletePromise
  })

  test('Should get key and values', async () => {
    const cache = new InterruptiveAsyncCache()

    const entrySet = [['k1', 'v1'], ['k2', 'v2'], ['k3', 'v3']]

    await Promise.all(entrySet.map(([key, value]) => {
      return cache.set(key, value)
    }))

    const keys = cache.keys()
    const values = cache.values()
    const entries = cache.entries()

    expect(keys.next).toBeTruthy()
    expect(values.next).toBeTruthy()
    expect(entries.next).toBeTruthy()

    await expect(Array.fromAsync(keys)).resolves.toMatchObject(entrySet.map(([key]) => key))
    await expect(Array.fromAsync(values)).resolves.toMatchObject(entrySet.map(([, value]) => value))
    await expect(Array.fromAsync(entries)).resolves.toMatchObject(entrySet)
    await expect(Array.fromAsync(cache)).resolves.toMatchObject(entrySet)
  })

  test('Should cache get promises', async () => {
    const cache = new InterruptiveAsyncCache()

    const key = 'key'
    const value = 'value'

    await cache.set(key, value)

    const getPromise = cache.get(key)
    const getPromise2 = cache.get(key)

    expect(getPromise2).toBe(getPromise)
    await expect(getPromise).resolves.toBe(value)

    const hasPromise = cache.has(key)
    const hasPromise2 = cache.has(key)

    expect(hasPromise2).toBe(hasPromise)

    await expect(hasPromise).resolves.toBe(true)
  })

  // If a key is being set, existing get methods should wait for it to ensure they have the latest value
  test('Should wait for existing set action before get', async () => {
    const cache = new InterruptiveAsyncCache<string, string>(createAbstractAsyncCache())

    const key = 'key'
    const value = 'value'

    cache.set(key, value)
    const getPromise = cache.get(key)

    await expect(getPromise).resolves.toBe(value)
  })

  // race conditions:
  test('Should interrupt a get call with a set', async () => {
    const cache = new InterruptiveAsyncCache<string, string>(createAbstractAsyncCache())

    const key = 'key'
    const value = 'value'

    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)

    const getPromise = cache.get(key) // alone, this would be undefined again
    const setPromise = cache.set(key, value)

    await expect(getPromise).resolves.toBe(value)
    await expect(setPromise).resolves.toBe(undefined)
  })

  test.skip('Should interrupt a set with a failed set', async () => {
    const baseCache = createAbstractAsyncCache<string, string>()
    jest.spyOn(baseCache, 'set').mockImplementation(() => {
      return delay(5).then(() => Promise.reject(new Error('set rejected')))
    })

    const cache = new InterruptiveAsyncCache(baseCache)

    await expect(cache.set('k', 'v')).rejects.toThrow()

    // const key = 'key'
    // const value = 'value'

    // const setPromise = cache.set(key, value)
    // const setPromise2 = cache.set(key, value)

    // await expect(setPromise).rejects.toThrow('set rejected')
    // await expect(setPromise2).rejects.toThrow('set rejected')

    jest.resetAllMocks()
  })

  test('Should interrupt a set call with a set', async () => {
    const cache = new InterruptiveAsyncCache<string, string>(createAbstractAsyncCache())

    const key = 'key'
    const value = 'value'
    const value2 = 'value2'

    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)

    const getPromise = cache.get(key) // alone, this would be undefined again
    const setPromise = cache.set(key, value)
    const setPromise2 = cache.set(key, value2)

    await expect(getPromise).resolves.toBe(value2)
    await expect(setPromise).resolves.toBe(undefined)
    await expect(setPromise2).resolves.toBe(undefined)
  })

  test('Should interrupt a has call with a set', async () => {
    const cache = new InterruptiveAsyncCache<string, string>(createAbstractAsyncCache())

    const key = 'key'
    const value = 'value'
    const value2 = 'value2'

    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)

    const hasPromise = cache.has(key) // alone, this would be undefined again
    const setPromise = cache.set(key, value)
    const setPromise2 = cache.set(key, value2)

    await expect(hasPromise).resolves.toBe(true)
    await expect(setPromise).resolves.toBe(undefined)
    await expect(setPromise2).resolves.toBe(undefined)
  })
})
