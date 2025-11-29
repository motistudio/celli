import {describe, test, expect, vi, beforeAll, afterEach, afterAll} from 'vitest'

import type {Cache as ICache} from '../../../src/types/cache.t'
import type {Effect} from '../../../src/types/effects.t'

import defer from '../../../src/commons/promise/defer'
import isThentable from '../../../src/commons/promise/isThentable'
import getPromiseState from '../../../src/commons/promise/getPromiseState'

import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import LifeCycleCache from '../../../src/cache/implementations/LifeCycleCache'
import ttl from '../../../src/cache/implementations/LifeCycleCache/effects/ttl'

import LifeCycleItem from '../../../src/cache/implementations/LifeCycleCache/LifeCycleItem'
import RemoteApi from '../../../src/cache/implementations/LifeCycleCache/RemoteApi'
import {CLEANUP_QUEUE} from '../../../src/cache/implementations/LifeCycleCache/constants'
import {CACHE_KEY} from '../../../src/cache/constants'

describe('LifeCycle Cache', () => {
  test('Should create a simple sync lifecycle cache', () => {
    const cache = new LifeCycleCache<ICache<string, string>>()

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
    const asyncCache = new AsyncCache<string, string>()
    const cache = new LifeCycleCache(asyncCache)

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

    await cache.set(key, value)
    await expect(cache.has(key)).resolves.toBe(true)

    // clean works when the origin cache cleans as well
    await asyncCache.clean()
    await expect(cache.has(key)).resolves.toBe(false)
  })

  describe('Effects', () => {
    test('Should add an effect', () => {
      const cache = new LifeCycleCache<ICache<string, string>>()

      const key = 'key'
      const value = 'value'
      const cleanup = vi.fn()
      const effect = vi.fn(() => {
        return cleanup
      })
      const readHandler = vi.fn()

      cache.set(key, value, [effect])
      expect(effect).toHaveBeenCalled()

      const [api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
      expect(api.getSelf()).toBe(value)

      expect(api.getSelf()).toBe(value) // last value that was actually set
      api.onRead(readHandler)
      expect(cache.get(key)).toBe(value)
      expect(readHandler).toHaveBeenCalled()
      api.deleteSelf()
      expect(cache.has(key)).toBe(false)
      expect(cleanup).toHaveBeenCalled()
    })

    test('Should add an effect for a complex value', () => {
      const cache = new LifeCycleCache<ICache<string, object>>()

      const key = 'key'
      const value = {}
      const cleanup = vi.fn()
      const effect = vi.fn(() => {
        return cleanup
      })
      const readHandler = vi.fn()

      cache.set(key, value, [effect])
      expect(effect).toHaveBeenCalled()

      const [api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
      expect(api.getSelf()).toBe(value)

      expect(api.getSelf()).toBe(value) // last value that was actually set
      api.onRead(readHandler)
      expect(cache.get(key)).toBe(value)
      expect(readHandler).toHaveBeenCalled()
      api.deleteSelf()
      expect(cache.has(key)).toBe(false)
      expect(cleanup).toHaveBeenCalled()
    })

    test('Should add an async effect', async () => {
      const cache = new LifeCycleCache(new AsyncCache<string, string>)

      const key = 'key'
      const value = 'value'
      const cleanup = vi.fn()
      const effect = vi.fn(() => {
        return cleanup
      })
      const readHandler = vi.fn()

      await cache.set(key, value, [effect])
      expect(effect).toHaveBeenCalled()

      const [api] = (effect.mock.calls[0] as unknown as Parameters<Effect<string>>)
      expect(api.getSelf()).toBe(value)

      api.onRead(readHandler)
      await expect(cache.get(key)).resolves.toBe(value) // reads a value, should trigger the handler
      expect(readHandler).toHaveBeenCalled()

      api.deleteSelf()
      await expect(cache.has(key)).resolves.toBe(false)
      expect(cleanup).toHaveBeenCalled()
    })

    test('Should cleanup async effects and their cleanups', async () => {
      const cache = new LifeCycleCache(new AsyncCache<string, string>())

      const key = 'key'
      const value = 'value'

      const cleanup = vi.fn(() => Promise.resolve())
      const effect = vi.fn(() => {
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

      const cleanup = vi.fn(() => Promise.resolve())
      const effect = vi.fn(() => {
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
      const cache = new LifeCycleCache<ICache<string, string>>()

      const key = 'key'
      const value = 'value'

      const cleanup = vi.fn(() => Promise.resolve())
      const effect = vi.fn(() => {
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

      // const spy = vi.spyOn(cache, 'delete')
      const spy = vi.spyOn(cache[CACHE_KEY], 'clean')

      const key = 'key'
      const value = 'value'

      const futureCleanupDeferredPromise = defer<void>()
      const futureCleanupDeferredPromiseState = getPromiseState(futureCleanupDeferredPromise.promise)
      const cleanup = vi.fn(() => futureCleanupDeferredPromise.promise)
      const effect = vi.fn(() => {
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

  // describe('Common Effects', () => {
  //   describe('TTL', () => {
  //     test('Should create a timeout', () => {
  //       const key = 'key'
  //       const value = 'value'

  //       const cache = new LifeCycleCache()

  //       const ttlEffect = ttl({timeout: 1000})

  //       const remoteApi = new RemoteApi(cache, key, value)

  //       const cleanup = ttlEffect(remoteApi)
  //       expect(cleanup).toBeDefined()
  //       expect(typeof cleanup).toBe('function')
  //     })
  //   })
  // })

  describe('Effect Implementations', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.clearAllTimers()
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should create items with ttl', () => {
      const cache = new LifeCycleCache()

      const key = 'key'
      const value = 'value'

      cache.set(key, value, [ttl({timeout: 1000})])
      expect(cache.has(key)).toBe(true)

      vi.advanceTimersByTime(1001)

      expect(cache.has(key)).toBe(false)

      cache.set(key, value, [ttl({timeout: 1000})])
      expect(cache.has(key)).toBe(true)

      vi.advanceTimersByTime(600) // half way to deletion
      expect(cache.has(key)).toBe(true)

      expect(cache.get(key)).toBe(value) // but a read action should reset the item
      vi.advanceTimersByTime(500) // (600 + 500) more than the timeout
      expect(cache.has(key)).toBe(true) // and it still exists

      vi.advanceTimersByTime(1001)
      expect(cache.has(key)).toBe(false) // resets after waiting again

      cache.set(key, value, [ttl({timeout: 1000})])
      expect(cache.has(key)).toBe(true)

      cache.clean()
      expect(cache.has(key)).toBe(false)
    })

    test('Should prolong ttl on read when prolong is true (default)', () => {
      const cache = new LifeCycleCache()

      const key = 'key'
      const value = 'value'

      cache.set(key, value, [ttl({timeout: 1000, prolong: true})])
      expect(cache.has(key)).toBe(true)

      vi.advanceTimersByTime(800)
      expect(cache.has(key)).toBe(true)

      // Reading the value should reset the ttl
      cache.get(key)

      vi.advanceTimersByTime(800) // 800ms after read, still within new ttl window
      expect(cache.has(key)).toBe(true)

      vi.advanceTimersByTime(300) // now 1100ms after read, should be expired
      expect(cache.has(key)).toBe(false)
    })

    test('Should not prolong ttl on read when prolong is false', () => {
      const cache = new LifeCycleCache()

      const key = 'key'
      const value = 'value'

      cache.set(key, value, [ttl({timeout: 1000, prolong: false})])
      expect(cache.has(key)).toBe(true)

      vi.advanceTimersByTime(800)
      expect(cache.has(key)).toBe(true)

      // Reading the value should NOT reset the ttl
      cache.get(key)

      vi.advanceTimersByTime(300) // 1100ms total since set, should be expired
      expect(cache.has(key)).toBe(false)
    })
  })

  describe('Events', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.clearAllTimers()
    })
    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should subscribe to events', () => {
      const getHandler = vi.fn()
      const setHandler = vi.fn()
      const deleteHandler = vi.fn()
      const cleanHandler = vi.fn()

      const cache = new LifeCycleCache<ICache<string, string>>()

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

    test('Should notify about deletion', () => {
      const cleanupTime = 1000

      const cleanup = vi.fn()
      const ttlEffect: Effect<string> = vi.fn((api) => {
        const timeoutHandler = setTimeout(() => api.deleteSelf(), cleanupTime)
        return () => {
          clearTimeout(timeoutHandler)
          return cleanup()
        }
      })

      const deleteHandler = vi.fn()
      const cleanHandler = vi.fn()

      const baseCache = new Cache<string, string>()
      const cache = new LifeCycleCache(baseCache)
      cache.on('delete', deleteHandler)
      cache.on('clean', cleanHandler)

      const key = 'key'
      const value = 'value'

      cache.set(key, value, [ttlEffect])
      expect(cache.has(key)).toBe(true)
      expect(ttlEffect).toHaveBeenCalledTimes(1)

      baseCache.delete(key)
      expect(cache.has(key)).toBe(false)
      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(deleteHandler).toHaveBeenCalledTimes(1)

      // now from inner deletion:
      cache.set(key, value, [ttlEffect])
      expect(cache.has(key)).toBe(true)
      expect(ttlEffect).toHaveBeenCalledTimes(2)
      vi.advanceTimersByTime(cleanupTime + 1)
      expect(cache.has(key)).toBe(false)
      expect(cleanup).toHaveBeenCalledTimes(2)
      expect(deleteHandler).toHaveBeenCalledTimes(2)

      // now for final cleanup:
      cache.set(key, value, [ttlEffect])
      expect(cache.has(key)).toBe(true)
      cache.clean()
      expect(cache.has(key)).toBe(false)
      expect(cleanup).toHaveBeenCalledTimes(3)
      expect(cleanHandler).toHaveBeenCalledTimes(1)
      expect(deleteHandler).toHaveBeenCalledTimes(2) // still 2
    })
  })

  describe('Symbol.dispose', () => {
    test('Should clean sync cache when disposed', () => {
      const cache = new LifeCycleCache<ICache<string, string>>()

      cache.set('key1', 'value1')
      cache.set('key2', 'value2')

      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(true)

      cache[Symbol.dispose]()

      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
    })

    test('Should clean async cache when disposed', async () => {
      const cache = new LifeCycleCache(new AsyncCache<string, string>())

      await cache.set('key1', 'value1')
      await cache.set('key2', 'value2')

      await expect(cache.has('key1')).resolves.toBe(true)
      await expect(cache.has('key2')).resolves.toBe(true)

      await cache[Symbol.dispose]()

      await expect(cache.has('key1')).resolves.toBe(false)
      await expect(cache.has('key2')).resolves.toBe(false)
    })
  })
})
