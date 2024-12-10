import {CACHE_KEY} from '../../../src/cache/constants'
import RemoteCache from '../../../src/cache/implementations/RemoteCache'
import ttl from '../../../src/cache/implementations/LifeCycleCache/effects/ttl'

import {
  compose,
  sync,
  source,
  lru,
  async,
  lifeCycle,
  effects,
  remote,
  SourceCleanupPolicies,
  type ICache,
  type AsyncCache
} from '../../../src/index'

describe('Creating and composing cache', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.clearAllTimers()
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  test('Should create a basic cache', () => {
    const cache = sync()
    const key = 'k'
    const value = 'v'

    expect(cache.get(key)).toBe(undefined)
    expect(cache.has(key)).toBe(false)

    cache.set(key, value)

    expect(cache.get(key)).toBe(value)
    expect(cache.has(key)).toBe(true)

    cache.delete(key)

    expect(cache.get(key)).toBe(undefined)
    expect(cache.has(key)).toBe(false)
  })

  test('Should compose an async cache', async () => {
    const cache = async()(sync())
    const key = 'k'
    const value = 'v'

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)

    await cache.set(key, value)

    await expect(cache.get(key)).resolves.toBe(value)
    await expect(cache.has(key)).resolves.toBe(true)

    await cache.delete(key)

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
  })

  test('Should compose an lru cache', async () => {
    const asyncCache = async()(sync<string, string>())
    const cache = lru({maxSize: 1})(asyncCache)
    const key = 'k'
    const value = 'v'

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)

    await cache.set(key, value)

    await expect(cache.get(key)).resolves.toBe(value)
    await expect(cache.has(key)).resolves.toBe(true)

    await cache.delete(key)

    await expect(cache.get(key)).resolves.toBe(undefined)
    await expect(cache.has(key)).resolves.toBe(false)
  })

  test('Should compose a lifeCycle cache', () => {
    const lifeCycleCache = lifeCycle<ICache<string, string>>()(sync<string, string>())
    const lruCache = lru<typeof lifeCycleCache>({maxSize: 2})(lifeCycleCache)

    const cleanup = jest.fn(() => undefined)
    const effect = jest.fn(() => {
      return cleanup
    })

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2'],
      ['k3', 'v3']
    ]

    lruCache.set(pairs[0][0], pairs[0][1], [effect])
    expect(lruCache.has(pairs[0][0])).toBe(true)

    lruCache.set(pairs[1][0], pairs[1][1], [effect])
    expect(lruCache.has(pairs[1][0])).toBe(true)

    lruCache.set(pairs[2][0], pairs[2][1], [effect])
    expect(lruCache.has(pairs[2][0])).toBe(true)

    expect(lruCache.has(pairs[0][0])).toBe(false) // been removed
    expect(cleanup).toHaveBeenCalled()

    lruCache.clean()
  })

  test('Should compose effects cache', () => {
    const lruCache = lru({maxSize: 1})(sync<string, string>())
    const effectsCache = effects([ttl({timeout: 1000})])(lruCache)

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2']
    ]

    effectsCache.set(pairs[0][0], pairs[0][1])
    expect(effectsCache.has(pairs[0][0])).toBe(true)

    jest.advanceTimersByTime(1001)
    expect(effectsCache.has(pairs[0][0])).toBe(false)

    effectsCache.set(pairs[0][0], pairs[0][1])
    expect(effectsCache.has(pairs[0][0])).toBe(true)

    effectsCache.set(pairs[1][0], pairs[1][1])
    expect(effectsCache.has(pairs[1][0])).toBe(true)
    expect(effectsCache.has(pairs[0][0])).toBe(false) // was removed because of lru

    effectsCache.clean()
    jest.clearAllTimers()
  })

  test('Should compose a remote cache', async () => {
    const cache = compose(
      effects([
        ttl({timeout: 1000})
      ]),
      lru({maxSize: 2}),
      async(),
      remote(source(sync()), {cleanupPolicy: SourceCleanupPolicies.ALL}) // potentially redis and stuff
    )(sync()) as AsyncCache<string, string>

    const frontCache = (cache as RemoteCache<string, string>)[CACHE_KEY]

    const pairs: [string, string][] = [
      ['k1', 'v1'],
      ['k2', 'v2'],
      ['k3', 'v3']
    ]

    await cache.set(pairs[0][0], pairs[0][1])
    await expect(cache.has(pairs[0][0])).resolves.toBe(true)
    await expect(cache.get(pairs[0][0])).resolves.toBe(pairs[0][1])

    await cache.set(pairs[1][0], pairs[1][1])
    await expect(cache.has(pairs[1][0])).resolves.toBe(true)

    jest.advanceTimersByTime(600)

    await cache.set(pairs[2][0], pairs[2][1])
    await expect(cache.has(pairs[2][0])).resolves.toBe(true)
    await expect(frontCache.has(pairs[0][0])).resolves.toBe(false) // no longer exist because of lru

    jest.advanceTimersByTime(500)
    await expect(frontCache.has(pairs[1][0])).resolves.toBe(false) // no longer exist because of ttl

    await cache.clean()
    await expect(cache.has(pairs[2][0])).resolves.toBe(false)

    jest.runAllTimers()
  })
})
