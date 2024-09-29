import type {Cache, AsyncCache as IAsyncCache} from '../../../src/types/cache.t'
import type {Effect} from '../../../src/types/effects.t'

import defer from '../../../src/commons/promise/defer'
import isThentable from '../../../src/commons/promise/isThentable'

import LifeCycleCache from '../../../src/cache/implementations/LifeCycleCache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import getPromiseState from '../../../src/commons/promise/getPromiseState'
import { CLEANUP_QUEUE } from '../../../src/cache/implementations/LifeCycleCache/constants'
  
  describe('LifeCycle Cache', () => {
    test('Should create a simple sync lifecycle cache', () => {
      const cache = new LifeCycleCache<string, string>() as Cache<string, string>

      const key = 'test'
      const value = 'also test'

      cache.set(key, value)

      expect(cache.get(key)).toBe(value)
      expect(cache.has(key)).toBe(true)

      // enumeration:
      expect(Array.from(cache.keys())).toMatchObject([key])
      expect(Array.from(cache.values())).toMatchObject([value])
      expect(Array.from(cache.entries())).toMatchObject([[key, value]])
      expect(Array.from(cache)).toMatchObject([[key, value]])

      cache.delete(key)
      expect(cache.has(key)).toBe(false)

      cache.set(key, value)
      expect(cache.has(key)).toBe(true)

      cache.clean()
      expect(Array.from(cache.keys())).toMatchObject([])
    })

    test('Should create a simple async lifecycle cache', async () => {
      const cache = new LifeCycleCache<string, string>(new AsyncCache()) as IAsyncCache<string, string>

      const key = 'test'
      const value = 'also test'

      await cache.set(key, value)

      await expect(cache.get(key)).resolves.toBe(value)
      await expect(cache.has(key)).resolves.toBe(true)
      
      // enumeration:
      await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([key])
      await expect(Array.fromAsync(cache.values())).resolves.toMatchObject([value])
      await expect(Array.fromAsync(cache.entries())).resolves.toMatchObject([[key, value]])
      await expect(Array.fromAsync(cache)).resolves.toMatchObject([[key, value]])

      await cache.delete(key)
      await expect(cache.has(key)).resolves.toBe(false)

      
      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)

      await cache.clean()
      await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([])
    })

    describe('Effects', () => {
      test('Should add an effect', () => {
        const cache = new LifeCycleCache<string, string>()

        const key = 'key'
        const value = 'value'
        const value2 = 'value2'
        const cleanup = jest.fn()
        const effect = jest.fn(() => {
          return cleanup
        })
        const readHandler = jest.fn()

        cache.set(key, value, [effect])
        expect(effect).toHaveBeenCalled()

        const [initialValue, api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
        expect(initialValue).toBe(value)

        expect(api.getSelf()).toBe(value) // last value that was actually set
        expect(api.setSelf(value2)).toBe(undefined) // not returning a promise
        expect(api.getSelf()).toBe(value2)
        api.onRead(readHandler)
        expect(cache.get(key)).toBe(value2)
        expect(readHandler).toHaveBeenCalled()
        api.deleteSelf()
        expect(cache.has(key)).toBe(false)
        expect(cleanup).toHaveBeenCalled()
      })

      test('Should cleanup async effects and their cleanups', async () => {
        const cache = new LifeCycleCache(new AsyncCache<string, string>())

        const key = 'key'
        const value = 'value'

        const cleanup = jest.fn(() => Promise.resolve())
        const effect = jest.fn(() => {
          return cleanup
        })

        await cache.set(key, value, [effect])
        await expect(cache.has(key)).resolves.toBe(true)
        expect(effect).toHaveBeenCalledTimes(1)
        
        // resetting a key, should run the effect again
        await cache.set(key, value, [effect])
        expect(cleanup).toHaveBeenCalledTimes(1)
        expect(effect).toHaveBeenCalledTimes(2)
        
        await cache.delete(key)
        expect(cleanup).toHaveBeenCalledTimes(2)

        await cache.set(key, value, [effect])
        expect(effect).toHaveBeenCalledTimes(3)
        
        await cache.clean()
        expect(cleanup).toHaveBeenCalledTimes(3)
        await expect(cache.has(key)).resolves.toBe(false)
      })

      test('Should cleanup async effects while already deleting it', async () => {
        const cache = new LifeCycleCache(new AsyncCache<string, string>())

        const key = 'key'
        const value = 'value'

        const cleanup = jest.fn(() => Promise.resolve())
        const effect = jest.fn(() => {
          return cleanup
        })

        await cache.set(key, value, [effect])
        await expect(cache.has(key)).resolves.toBe(true)

        // triggers both delete and clean
        // delete is async
        cache.delete(key)
        await cache.clean()

        expect(cleanup).toHaveBeenCalledTimes(1)
        await expect(cache.has(key)).resolves.toBe(false)
      })

      test('Should clean async cache with async cleanups', async () => {
        const cache = new LifeCycleCache<string, string>()

        const key = 'key'
        const value = 'value'

        const cleanup = jest.fn(() => Promise.resolve())
        const effect = jest.fn(() => {
          return cleanup
        })

        cache.set(key, value, [effect])
        expect(cache.has(key)).toBe(true)

        cache.delete(key) // will cause a cleanup
        expect(cleanup).toHaveBeenCalled()
        await cleanup.mock.results[0]

        expect(cache.has(key)).toBe(false)
      })

      test('Should wait for long cleanups when cleaning a cache', async () => {
        const cache = new LifeCycleCache(new AsyncCache<string, string>())

        const spy = jest.spyOn(cache, 'delete')

        const key = 'key'
        const value = 'value'

        const futureCleanupDeferredPromise = defer<void>()
        const futureCleanupDeferredPromiseState = getPromiseState(futureCleanupDeferredPromise.promise)
        const cleanup = jest.fn(() => futureCleanupDeferredPromise.promise)
        const effect = jest.fn(() => {
          return cleanup
        })

        await cache.set(key, value, [effect])

        const cleanPromise = cache.clean() as Promise<void>
        const cleanPromiseState = getPromiseState(cleanPromise)

        expect(cleanPromiseState.finished).toBe(false)
        expect(spy).toHaveBeenCalledWith(key)
        expect(isThentable(spy.mock.results[0]?.value)).toBe(true)
        await spy.mock.results[0].value
        expect(cache[CLEANUP_QUEUE].size).toBe(1);

        expect(cleanPromiseState.finished).toBe(false) // the clean has yet to be finished
        expect(futureCleanupDeferredPromiseState.resolved).toBe(false)
        futureCleanupDeferredPromise.resolve()
        await expect(cleanPromise).resolves.toBe(undefined) // cleanup is now finished
        expect(futureCleanupDeferredPromiseState.resolved).toBe(true)
      })
    })
  })
