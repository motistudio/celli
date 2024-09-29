import delay from '../../../src/commons/promise/delay'
import isThentable from '../../../src/commons/promise/isThentable'
import {
  GET_PROMISES_KEY,
  SET_PROMISES_KEY,
  HAS_PROMISES_KEY,
  DELETE_PROMISES_KEY
} from '../../../src/cache/constants'
import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'

import getPromiseState from '../../../src/commons/promise/getPromiseState'

describe('Async Cache', () => {
  test.each([new AsyncCache<string, any>(), new AsyncCache<string, any>(new AsyncCache)])('Should create a simple async cache', async (cache) => {
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
    const cache = new AsyncCache()

    const key = 'key'

    const deletePromise = cache.delete(key)
    const deletePromise2 = cache.delete(key)

    expect(deletePromise).toBe(deletePromise2)

    await deletePromise
  })

  test('Should get keys, values and entries', async () => {
    const cache = new AsyncCache()

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

  test('Should cleanup all values', async () => {
    const cache = new AsyncCache<string, string>()

    const pairs = [['key1', 'value'], ['key2', 'value2'], ['key3', 'value3']]

    await Promise.all(pairs.map(([key, value]) => cache.set(key, value)))
    // all exist
    await expect(Promise.all(pairs.map(([key]) => cache.has(key))).then((indications) => indications.every((indication) => indication))).resolves.toBe(true)

    await cache.clean()
    // all are missing
    await expect(Promise.all(pairs.map(([key]) => cache.has(key))).then((indications) => indications.every((indication) => !indication))).resolves.toBe(true)
  })

  describe('Get() behaviour', () => {
    test('Should cache get promises', async () => {
      const cache = new AsyncCache()
  
      const key = 'key'
      const value = 'value'
  
      await cache.set(key, value)
  
      const getPromise = cache.get(key)
      const getPromise2 = cache.get(key)
  
      expect(getPromise2).toBe(getPromise)
      await expect(getPromise).resolves.toBe(value)
      
      const getPromise3 = cache.get(key)
      expect(getPromise3).not.toBe(getPromise)
      await expect(getPromise3).resolves.toBe(value)
      expect(cache[GET_PROMISES_KEY].get(key)).toBeFalsy()
    })
  
    test('Should wait for existing set operation to finish', async () => {
      const baseCache = new AsyncCache()
      const setter = jest.spyOn(baseCache, 'set')

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      const setPromise = cache.set(key, value)
      expect(setter).toHaveBeenCalledTimes(1)
      expect(isThentable((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)
  
      const getPromise = cache.get(key)
      const getterState = getPromiseState(getPromise)
      expect(promiseState.finished).toBe(false)
      expect(getterState.finished).toBe(false)
      await setPromise
      expect(promiseState.finished).toBe(true)
      expect(getterState.finished).toBe(false)
      await expect(getPromise).resolves.toBe(value)
      expect(getterState.finished).toBe(true)
    })

    test('Should fail (intentionally) to get a value', async () => {
      const baseCache = new AsyncCache()
      baseCache.get = () => Promise.reject(new Error('Expected error'))
      const cache = new AsyncCache(baseCache)

      await expect(cache.get('smtng')).rejects.toThrow()
    })

    test.skip('Should wait for existing set() even if it fails', () => {
      const baseCache = new AsyncCache()
      // const setterCall = jest.fn()
      // // let setterPromise: Promise<void> | undefined = undefined
      // const setter = () => {
      //   setterCall()
      //   return Promise.reject(new Error('Rejects!'))
      // }
      // baseCache.set = setter

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      // expect(() => cache.set(key, value)).rejects.toThrow()
      const error = new Error('Expected reject')
      const rejectedPromise = Promise.reject(error)
      cache[SET_PROMISES_KEY].set(key, rejectedPromise)
      const promiseState = getPromiseState(rejectedPromise)
      expect(promiseState.finished).toBe(false)

      const getterPromiseState = getPromiseState(cache.get(key))
      // rejectedPromise.catch(() => {
      //   console.log('all good')
      // })
      return new Promise<void>((resolve, reject) => {
        rejectedPromise.catch((e) => {
          expect(e).toBe(error)
          expect(promiseState.finished).toBe(true)
          expect(promiseState.rejected).toBe(true)
          expect(getterPromiseState.finished).toBe(false)

          return getterPromiseState.promise.then((value) => {
            expect(value).toBe(undefined) // since it wasn't set in the end
            expect(getterPromiseState.finished).toBe(true)
            expect(getterPromiseState.resolved).toBe(true)
            resolve()
          })
        }).then(() => {
          reject(new Error('Promise was suppose to fail'))
        })
      })
      // expect(rejectedPromise).rejects.toThrow()
      // await expect(cache.get(key)).resolves.toBe(undefined)
    })
  
    test.skip('Should wait for existing set operation to finish even when it fails', async () => {
      await expect(Promise.reject(new Error('Rejects!'))).rejects.toThrow()
      const baseCache = new AsyncCache()
      const setterCall = jest.fn()
      let setterPromise: Promise<void> | undefined = undefined
      const setter = () => {
        setterCall()
        setterPromise = Promise.reject(new Error('Rejects!'))

        return setterPromise
      }
      baseCache.set = setter

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      const setPromise = cache.set(key, value)
      expect(isThentable(setPromise)).toBe(true)
      expect(setterCall).toHaveBeenCalledTimes(1)
      expect(isThentable(setterPromise as unknown as Promise<void>)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState(setterPromise as unknown as Promise<void>)

      const getPromise = cache.get(key)
      const getterState = getPromiseState(getPromise)
      expect(promiseState.finished).toBe(false)
      expect(getterState.finished).toBe(false)

      // await Promise.allSettled([setPromise])
      // await delay(1000)
      await expect(getPromise).resolves.toBe(undefined)
      // await expect(setPromise).rejects.toThrow()
      // expect(promiseState.finished).toBe(true)
      // expect(promiseState.rejected).toBe(true)
      // expect(getterState.finished).toBe(false)
      // await expect(getPromise).resolves.toBe(undefined) // since the set never really happened
      // expect(getterState.finished).toBe(true)
    })
  })

  describe('Set() behaviour', () => {
    test('Should wait for existing set() operation', async () => {
      const baseCache = new AsyncCache()
      const setter = jest.spyOn(baseCache, 'set')

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'
      const value2 = 'value2'

      const setPromise = cache.set(key, value)
      expect(setter).toHaveBeenCalledTimes(1)
      expect(isThentable((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)
      
      const setPromise2 = cache.set(key, value2)
      const promiseState2 = getPromiseState(setPromise2)

      expect(promiseState.finished).toBe(false)
      expect(promiseState2.finished).toBe(false)

      await setPromise
      expect(promiseState.finished).toBe(true)
      expect(promiseState2.finished).toBe(false)

      await setPromise2
      expect(promiseState2.finished).toBe(true)
    })

    test('Should fail (intentionally) when waiting for an existing set()', async () => {
      const baseCache = new AsyncCache()
      const setter = jest.spyOn(baseCache, 'set')
      baseCache.has = () => Promise.reject(new Error('Expected has() reject'))

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      const setPromise = cache.set(key, value)
      expect(setter).toHaveBeenCalledTimes(1)
      expect(isThentable((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)

      setter.mockImplementation(() => Promise.reject(new Error('Intentional rejection')))
  
      const setPromise2 = cache.set(key, 'val')
      const setPromiseState = getPromiseState(setPromise2)
      expect(promiseState.finished).toBe(false)
      expect(setPromiseState.finished).toBe(false)
      await setPromise
      expect(promiseState.finished).toBe(true)
      expect(setPromiseState.finished).toBe(false)
      await expect(setPromise2).rejects.toThrow()
      expect(setPromiseState.finished).toBe(true)
      expect(setPromiseState.rejected).toBe(true)
    })

    test('Should fail (intentionally) to set a value', async () => {
      const baseCache = new AsyncCache()
      baseCache.set = () => Promise.reject(new Error('Expected error'))
      const cache = new AsyncCache(baseCache)

      await expect(cache.set('smtng', 'val')).rejects.toThrow()
    })
  })

  describe('Has() behaviour', () => {
    test('Should cache has calls', async () => {
      const cache = new AsyncCache()

      const key = 'key'
      const key2 = 'key2'
      const value = 'value'

      await cache.set(key, value)

      const hasPromise = cache.has(key)
      const hasPromise2 = cache.has(key)
      const hasPromise3 = cache.has(key2)

      expect(hasPromise).toBe(hasPromise2)
      expect(hasPromise3).not.toBe(hasPromise)
      await expect(hasPromise).resolves.toBe(true)
      await expect(hasPromise3).resolves.toBe(false)

      const hasPromise4 = cache.has(key)

      expect(hasPromise4).not.toBe(hasPromise)
      await expect(hasPromise4).resolves.toBe(true)
    })

    test('Should wait for an existing set() opration to finish', async () => {
      const baseCache = new AsyncCache()
      const setter = jest.spyOn(baseCache, 'set')

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      const setPromise = cache.set(key, value)
      expect(setter).toHaveBeenCalledTimes(1)
      expect(isThentable((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)
  
      const hasPromise = cache.has(key)
      const getterState = getPromiseState(hasPromise)
      expect(promiseState.finished).toBe(false)
      expect(getterState.finished).toBe(false)
      await setPromise
      expect(promiseState.finished).toBe(true)
      expect(getterState.finished).toBe(false)
      await expect(hasPromise).resolves.toBe(true)
      expect(getterState.finished).toBe(true)
    })

    test('Should fail (intentionally) when waiting for an existing set()', async () => {
      const baseCache = new AsyncCache()
      const setter = jest.spyOn(baseCache, 'set')
      baseCache.has = () => Promise.reject(new Error('Expected has() reject'))

      const cache = new AsyncCache(baseCache)

      const key = 'key'
      const value = 'value'

      const setPromise = cache.set(key, value)
      expect(setter).toHaveBeenCalledTimes(1)
      expect(isThentable((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)).toBe(true)
      // The state of the inner promise
      const promiseState = getPromiseState((setter.mock.results[0] as unknown as {value: Promise<typeof value>}).value)
  
      const hasPromise = cache.has(key)
      const hasPromiseState = getPromiseState(hasPromise)
      expect(promiseState.finished).toBe(false)
      expect(hasPromiseState.finished).toBe(false)
      await setPromise
      expect(promiseState.finished).toBe(true)
      expect(hasPromiseState.finished).toBe(false)
      await expect(hasPromise).rejects.toThrow()
      expect(hasPromiseState.finished).toBe(true)
      expect(hasPromiseState.rejected).toBe(true)
    })

    test('Should fail (intentionally) to has a value', async () => {
      const baseCache = new AsyncCache()
      baseCache.has = () => Promise.reject(new Error('Expected error'))
      const cache = new AsyncCache(baseCache)

      await expect(cache.has('smtng')).rejects.toThrow()
    })

  })

  describe('Delete() behaviour', () => {
    test('Should cache delete operations', async () => {
      const cache = new AsyncCache()

      const key = 'key'
      const key2 = 'key2'
      const value = 'value'

      await cache.set(key, value)
      await expect(cache.get(key)).resolves.toBe(value)

      const deletePromise = cache.delete(key)
      const deletePromise2 = cache.delete(key)
      const deletePromise3 = cache.delete(key2)

      expect(deletePromise).toBe(deletePromise2)
      expect(deletePromise3).not.toBe(deletePromise)
      await expect(deletePromise).resolves.toBe(undefined)
    })

    test('Should fail (intentionally) to has a value', async () => {
      const baseCache = new AsyncCache()
      baseCache.delete = () => Promise.reject(new Error('Expected error'))
      const cache = new AsyncCache(baseCache)

      await expect(cache.delete('smtng')).rejects.toThrow()
    })
  })

  describe('Clean() behaviour', () => {
    test.each([
      {description: 'No base cache', cache: new AsyncCache<string, string>()},
      {description: 'Regular cache cache', cache: new AsyncCache<string, string>(new Cache<string, string>())},
      {description: 'Regular cache cache', cache: new AsyncCache<string, string>(new AsyncCache())}
    ])('Should cleanup all values with: $description', async ({cache}) => {
      const pairs = [['key1', 'value'], ['key2', 'value2'], ['key3', 'value3']]

      await Promise.all(pairs.map(([key, value]) => cache.set(key, value)))
      // all exist
      await expect(Promise.all(pairs.map(([key]) => cache.has(key))).then((indications) => indications.every((indication) => indication))).resolves.toBe(true)

      await cache.clean()
      // all are missing
      await expect(Promise.all(pairs.map(([key]) => cache.has(key))).then((indications) => indications.every((indication) => !indication))).resolves.toBe(true)
    })
  })
})
