import {describe, test, expect, vi} from 'vitest'

import type {Cleanable} from '../../../src/types/cacheManager.t'

import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import Cache from '../../../src/cache/implementations/Cache'
import createCacheManager from '../../../src/createCacheManager'

describe('Cache Manager', () => {
  test('Should create a cache manager', async () => {
    const {register, clean, getAllResourceEntries} = createCacheManager()

    const cache1 = new Cache()
    const cache2 = new AsyncCache()

    const cleanSpy1 = vi.spyOn(cache1, 'clean')
    const cleanSpy2 = vi.spyOn(cache2, 'clean')

    register(cache1)
    register(cache2)

    expect(getAllResourceEntries()).toEqual([[undefined, cache1], [undefined, cache2]])

    const cleanPromise = clean()
    const cleanPromise2 = clean()
    expect(cleanPromise2).toBe(cleanPromise) // only one clean at a time

    await cleanPromise
    expect(cleanSpy1).toHaveBeenCalledTimes(1)
    expect(cleanSpy2).toHaveBeenCalledTimes(1)
  })

  test('Should register a cache with a name', () => {
    const {register, unregister, getByRef, getAllResourceEntries} = createCacheManager()

    const cache = new Cache()
    register(cache, 'test')

    expect(getByRef('test')).toBe(cache)
    expect(getAllResourceEntries()).toEqual([['test', cache]])

    unregister(getByRef('test') as Cleanable)
    expect(getByRef('test')).toBe(undefined)
  })

  test('Should unregister a cache', async () => {
    const {register, unregister, clean} = createCacheManager()

    const cache = new Cache()
    cache.set('test', 'test')
    expect(cache.get('test')).toBe('test')

    register(cache)

    await clean()
    expect(cache.get('test')).toBe(undefined)

    // Setting the value again
    cache.set('test', 'test')
    expect(cache.get('test')).toBe('test')

    unregister(cache)

    await clean()
    expect(cache.get('test')).toBe('test') // the value is still there
  })

  test('Should clean saved caches', async () => {
    const {register, clean} = createCacheManager()

    const cache1 = new Cache()
    const cache2 = new AsyncCache()

    cache1.set('test', 'test')
    await cache2.set('test', 'test')

    register(cache1, 'test1')
    register(cache2, 'test2')

    await clean()

    expect(cache1.get('test')).toBe(undefined)
    await expect(cache2.get('test')).resolves.toBe(undefined)
  })

  test('Should base a CacheManager on another CacheManager', async () => {
    const sharedCache = new Cache()
    const notSharedCache = new Cache()

    const cleanHandler = vi.fn()
    sharedCache.on('clean', cleanHandler)

    const baseCacheManager = createCacheManager()
    baseCacheManager.register(sharedCache, 'test')

    const {register, getByRef, clear} = createCacheManager(baseCacheManager)
    register(notSharedCache, 'notShared')

    expect(getByRef('test')).toBe(sharedCache)
    expect(getByRef('notShared')).toBe(notSharedCache)
    expect(baseCacheManager.getByRef('test')).toBe(sharedCache)
    expect(baseCacheManager.getByRef('notShared')).toBe(undefined)

    await baseCacheManager.clear()
    expect(cleanHandler).toHaveBeenCalledTimes(0)

    await clear()
    expect(cleanHandler).toHaveBeenCalledTimes(1)
  })

  describe('Clear logic', () => {
    test('Should clear all caches', async () => {
      const {register, clear} = createCacheManager()

      const cache1 = new Cache()
      const cache2 = new AsyncCache()

      cache1.set('key', 'value')
      await cache2.set('key', 'value')

      register(cache1)
      register(cache2)

      await clear()

      // Caches were cleaned, so the values should be undefined
      expect(cache1.get('key')).toBe(undefined)
      await expect(cache2.get('key')).resolves.toBe(undefined)

      // Setting the values again
      cache1.set('key', 'value')
      await cache2.set('key', 'value')

      // At this point, the caches should be already unregistered
      await clear()

      // So we anticipate the values to stay there
      expect(cache1.get('key')).toBe('value')
      await expect(cache2.get('key')).resolves.toBe('value')
    })

    test('Should not clean caches with more than one reference', async () => {
      const cm1 = createCacheManager()
      const cm2 = createCacheManager()

      const cache1 = new Cache()
      const cache2 = new Cache()
      cm1.register(cache1)
      cm1.register(cache2)
      cm2.register(cache1)

      cache1.set('key', 'value')
      cache2.set('key', 'value')

      expect(cache1.get('key')).toBe('value')
      expect(cache2.get('key')).toBe('value')

      await cm1.clear()

      // Only cache2 was cleaned, since it's not shared with other cache managers
      expect(cache1.has('key')).toBe(true)
      expect(cache2.has('key')).toBe(false)

      await cm2.clear()

      // Now both caches should be cleaned
      expect(cache1.has('key')).toBe(false)
      expect(cache2.has('key')).toBe(false)
    })

    test('Should subscribe to clear events', async () => {
      const {onClear, clear} = createCacheManager()

      const fn = vi.fn()
      const unsubscribe = onClear(fn)

      await clear()

      expect(fn).toHaveBeenCalledTimes(1)

      unsubscribe()

      await clear()

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
