import isThentable from '../../../src/commons/promise/isThentable'

import BackupCache from '../../../src/cache/implementations/BackupCache'
import Cache from '../../../src/cache/implementations/Cache'
import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import LruCache from '../../../src/cache/implementations/LruCache'
import { CleanupPolicies } from '../../../src/cache/implementations/BackupCache/constants'

describe('Backup cache', () => {
  test('Should create a basic backup cache', () => {
    const cache = new BackupCache<string, string>(new Map(), new Cache<string, string>())

    const key = 'key'
    const key2 = 'key2'
    const value = 'value'
    const value2 = 'value2'

    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)

    expect(isThentable(cache.set(key, value))).toBe(false)
    expect(cache.get(key)).toBe(value)

    expect(isThentable(cache.set(key2, value2))).toBe(false)
    expect(cache.get(key2)).toBe(value2)

    expect(Array.from(cache.keys() as IterableIterator<string>)).toMatchObject([key, key2])
    expect(Array.from(cache.values() as IterableIterator<string>)).toMatchObject([value, value2])
    expect(Array.from(cache.entries() as IterableIterator<[string, string]>)).toMatchObject([[key, value], [key2, value2]])
    expect(Array.from(cache as unknown as IterableIterator<[string, string]>)).toMatchObject([[key, value], [key2, value2]])

    expect(isThentable(cache.delete(key))).toBe(false)

    expect(isThentable(cache.set(key, value2))).toBe(false)
    expect(cache.get(key)).toBe(value2)

    expect(isThentable(cache.clean())).toBe(false)
    expect(cache.has(key)).toBe(false)
  })

  test('Should create a basic async backup cache', async () => {
    const cache = new BackupCache<string, string>(new AsyncCache(), new AsyncCache())

    const key = 'key'
    const key2 = 'key2'
    const value = 'value'
    const value2 = 'value2'

    await expect(cache.has(key)).resolves.toBe(false)
    await expect(cache.get(key)).resolves.toBe(undefined)

    await cache.set(key, value)
    await expect(cache.get(key)).resolves.toBe(value)

    await cache.set(key2, value2)
    await expect(cache.get(key2)).resolves.toBe(value2)

    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([key, key2])
    await expect(Array.fromAsync(cache.values())).resolves.toMatchObject([value, value2])
    await expect(Array.fromAsync(cache.entries())).resolves.toMatchObject([[key, value], [key2, value2]])
    await expect(Array.fromAsync(cache as unknown as IterableIterator<[string, string]>)).resolves.toMatchObject([[key, value], [key2, value2]])

    await cache.delete(key)
    await expect(cache.has(key)).resolves.toBe(false)

    await cache.set(key, value2)
    await expect(cache.get(key)).resolves.toBe(value2)

    await cache.clean()
    await expect(cache.has(key)).resolves.toBe(false)
  })

  test('Should create an async cache with lru', async () => {
    const backupCache = new AsyncCache<string, string>()
    const lruCache = new LruCache(new AsyncCache<string, string>(), {maxSize: 2})

    const cache = new BackupCache(lruCache, backupCache)

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2'],
      ['k3', 'v3']
    ]

    await expect(cache.has(pairs[0][0])).resolves.toBe(false)
    await cache.set(pairs[0][0], pairs[0][1])
    await expect(cache.has(pairs[0][0])).resolves.toBe(true)
    await expect(cache.get(pairs[0][0])).resolves.toBe(pairs[0][1])

    await cache.set(pairs[1][0], pairs[1][1])
    await expect(cache.get(pairs[1][0])).resolves.toBe(pairs[1][1])

    // on the third attempt, the lru will kick in
    await cache.set(pairs[2][0], pairs[2][1])
    await expect(cache.get(pairs[2][0])).resolves.toBe(pairs[2][1])

    await expect(lruCache.has(pairs[0][0])).resolves.toBe(false) // The first key is no longer saved on the lruCache
    await expect(cache.has(pairs[0][0])).resolves.toBe(true) // however, the cache says it's there

    await expect(cache.get(pairs[0][0])).resolves.toBe(pairs[0][1]) // The value is being taken from the backupCache
    await expect(lruCache.has(pairs[0][0])).resolves.toBe(true) // And re-introduce it to the lru cache

    // Now key 2 is the oldest and no longer exists on the lru
    await expect(lruCache.has(pairs[1][0])).resolves.toBe(false)
    await expect(cache.has(pairs[1][0])).resolves.toBe(true)
  })

  test('Should subscribe to events', async () => {
    const getHandler = jest.fn()
    const setHandler = jest.fn()
    const deleteHandler = jest.fn()
    const cleanHandler = jest.fn()

    const cache = new BackupCache<string, string>(new AsyncCache(), new AsyncCache())

    const unsubscribeGet = cache.on('get', getHandler)
    const unsubscribeSet = cache.on('set', setHandler)
    const unsubscribeDelete = cache.on('delete', deleteHandler)
    const unsubscribeClean = cache.on('clean', cleanHandler)

    const key = 'key'
    const value = 'value'

    await expect(cache.get(key)).resolves.toBe(undefined)
    expect(getHandler).toHaveBeenCalledTimes(1)
    expect(getHandler).toHaveBeenCalledWith(key)

    await cache.set(key, value)
    await expect(cache.get(key)).resolves.toBe(value)
    expect(getHandler).toHaveBeenCalledTimes(2)
    expect(setHandler).toHaveBeenCalledTimes(1)
    expect(setHandler.mock.calls.at(-1)).toMatchObject([key, value])

    await cache.delete(key)
    expect(deleteHandler).toHaveBeenCalledTimes(1)
    expect(deleteHandler).toHaveBeenCalledWith(key)

    await cache.clean()
    expect(cleanHandler).toHaveBeenCalledTimes(1)

    unsubscribeGet()
    unsubscribeSet()
    unsubscribeDelete()
    unsubscribeClean()

    await cache.set(key, value)
    expect(setHandler).toHaveBeenCalledTimes(1)
    await cache.get(key)
    expect(getHandler).toHaveBeenCalledTimes(2)
    await cache.delete(key)
    expect(deleteHandler).toHaveBeenCalledTimes(1)
    await cache.clean()
    expect(cleanHandler).toHaveBeenCalledTimes(1)
  })

  test('Should create a cache that doesn\'t clean from the source', async () => {
    const backupCache = new AsyncCache<string, string>()
    const frontCache = new AsyncCache<string, string>()

    const cache = new BackupCache(frontCache, backupCache, {deleteFromSource: false})

    const key = 'k1'
    const value = 'v1'

    await cache.set(key, value)
    await expect(cache.get(key)).resolves.toBe(value)

    await cache.delete(key)
    await expect(frontCache.has(key)).resolves.toBe(false)
    await expect(backupCache.has(key)).resolves.toBe(true)

    await cache.set(key, value)
    await expect(Array.fromAsync(frontCache.keys())).resolves.toMatchObject([key])
    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([key])

    await cache.clean()
    await expect(Array.fromAsync(frontCache.keys())).resolves.toMatchObject([])
    await expect(Array.fromAsync(backupCache.keys())).resolves.toMatchObject([key])
    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([key])
  })

  test('Should clean backup cache only from known keys', async () => {
    const backupCache = new AsyncCache<string, string>()
    const frontCache = new LruCache(new AsyncCache<string, string>(), {maxSize: 10})

    const cache = new BackupCache(frontCache, backupCache, {cleanupPolicy: CleanupPolicies.KEYS})

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2'],
      ['k3', 'v3']
    ]

    await Promise.all(pairs.map(([key, value]) => backupCache.set(key, value)))

    await expect(cache.get(pairs[0][0])).resolves.toBe(pairs[0][1]) // new value introduced to the cache
    await expect(cache.get(pairs[1][0])).resolves.toBe(pairs[1][1]) // new value introduced to the cache

    await expect(Array.fromAsync(backupCache.keys())).resolves.toMatchObject(pairs.map(pair => pair[0]))
    await expect(Array.fromAsync(frontCache.keys())).resolves.toMatchObject(pairs.slice(0, -1).map(pair => pair[0]))

    await cache.clean()
    await expect(Array.fromAsync(frontCache.keys())).resolves.toMatchObject([])
    await expect(Array.fromAsync(cache.keys())).resolves.toMatchObject([pairs[2][0]])
  })
})
