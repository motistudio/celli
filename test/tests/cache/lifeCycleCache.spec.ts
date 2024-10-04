import type {AnyCacheType, Cache, AsyncCache as IAsyncCache} from '../../../src/types/cache.t'
import type {Effect, EffectCallbackApi} from '../../../src/types/effects.t'

import defer from '../../../src/commons/promise/defer'
import isThentable from '../../../src/commons/promise/isThentable'
import getPromiseState from '../../../src/commons/promise/getPromiseState'

import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import LifeCycleCache from '../../../src/cache/implementations/LifeCycleCache'
import ttl from '../../../src/cache/implementations/LifeCycleCache/effects/ttl'

import {CLEANUP_QUEUE} from '../../../src/cache/implementations/LifeCycleCache/constants'
import { CACHE_KEY } from '../../../src/cache/constants'
  
  describe('LifeCycle Cache', () => {
    test('Should create a simple sync lifecycle cache', () => {
      const cache = new LifeCycleCache<Cache<string, string>>()

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
      const cache = new LifeCycleCache(new AsyncCache<string, string>())

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

      const deletePromise = cache.delete(key)
      const deletePromise2 = cache.delete(key)
      expect(deletePromise).toBe(deletePromise2) // delete promises should be cached
      await deletePromise
      await expect(cache.has(key)).resolves.toBe(false)

      
      await cache.set(key, value)
      await expect(cache.has(key)).resolves.toBe(true)

      await cache.clean()
      await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([])
    })

    describe('Effects', () => {
      test('Should add an effect', () => {
        const cache = new LifeCycleCache<Cache<string, string>>()

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

        const [api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
        expect(api.getSelf()).toBe(value)

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

      test('Should add an async effect', async () => {
        const cache = new LifeCycleCache(new AsyncCache<string, string>)

        const key = 'key'
        const value = 'value'
        const value2 = 'value2'
        const cleanup = jest.fn()
        const effect = jest.fn(() => {
          return cleanup
        })
        const readHandler = jest.fn()

        await cache.set(key, value, [effect])
        expect(effect).toHaveBeenCalled()

        const [api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
        expect(api.getSelf()).toBe(value)

        expect(api.getSelf()).toBe(value) // last value that was actually set
        await expect(api.setSelf(value2)).resolves.toBe(undefined) // not returning a promise
        expect(api.getSelf()).toBe(value2)
        api.onRead(readHandler)
        await expect(cache.get(key)).resolves.toBe(value2) // reads a value, should trigger the handler
        expect(readHandler).toHaveBeenCalled()

        const [{get}] = readHandler.mock.calls[0] as unknown as [EffectCallbackApi<string>]
        expect(get()).toBe(value2)

        api.deleteSelf()
        await expect(cache.has(key)).resolves.toBe(false)
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
        const cache = new LifeCycleCache<Cache<string, string>>()

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

        // const spy = jest.spyOn(cache, 'delete')
        const spy = jest.spyOn(cache[CACHE_KEY], 'clean')

        const key = 'key'
        const value = 'value'

        const futureCleanupDeferredPromise = defer<void>()
        const futureCleanupDeferredPromiseState = getPromiseState(futureCleanupDeferredPromise.promise)
        const cleanup = jest.fn(() => futureCleanupDeferredPromise.promise)
        const effect = jest.fn(() => {
          return cleanup
        })

        await cache.set(key, value, [effect])

        const cleanPromise = cache.clean()
        const cleanPromiseState = getPromiseState(cleanPromise)

        expect(cleanPromiseState.finished).toBe(false)
        // expect(spy).toHaveBeenCalledWith(key)
        // expect(isThentable(spy.mock.results[0]?.value)).toBe(true)
        // await spy.mock.results[0].value
        expect(cache[CLEANUP_QUEUE].size).toBe(1)

        expect(cleanPromiseState.finished).toBe(false) // the clean has yet to be finished
        expect(futureCleanupDeferredPromiseState.resolved).toBe(false)
        // inner clean:
        expect(spy).toHaveBeenCalled()
        expect(isThentable(spy.mock.results[0]?.value)).toBe(true)
        await spy.mock.results[0].value

        // resolves the cleanups
        futureCleanupDeferredPromise.resolve()
        await expect(cleanPromise).resolves.toBe(undefined) // cleanup is now finished
        expect(futureCleanupDeferredPromiseState.resolved).toBe(true)
      })
    })

    describe('Effect Implementations', () => {
      jest.useFakeTimers()

      afterEach(() => {
        jest.clearAllTimers()
      })

      test('Should create items with ttl', () => {
        const cache = new LifeCycleCache()

        const key = 'key'
        const value = 'value'

        cache.set(key, value, [ttl({timeout: 1000})])
        expect(cache.has(key)).toBe(true)

        jest.advanceTimersByTime(1001)

        expect(cache.has(key)).toBe(false)

        cache.set(key, value, [ttl({timeout: 1000})])
        expect(cache.has(key)).toBe(true)
        
        jest.advanceTimersByTime(600) // half way to deletion
        expect(cache.has(key)).toBe(true)
        
        expect(cache.get(key)).toBe(value) // but a read action should reset the item
        jest.advanceTimersByTime(500) // (600 + 500) more than the timeout
        expect(cache.has(key)).toBe(true) // and it still exists
        
        jest.advanceTimersByTime(1001)
        expect(cache.has(key)).toBe(false) // resets after waiting again

        cache.set(key, value, [ttl({timeout: 1000})])
        expect(cache.has(key)).toBe(true)

        cache.clean()
        expect(cache.has(key)).toBe(false)
      })
    })
  })
