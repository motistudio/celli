import AsyncCache from '../../../src/cache/implementations/AsyncCache'
import Cache from '../../../src/cache/implementations/Cache'
import createCacheManager from '../../../src/createCacheManager'

describe('Cache Manager', () => {
  test('Should create a cache manager', async () => {
    const {register, clean} = createCacheManager()

    const cache1 = new Cache()
    const cache2 = new AsyncCache()

    const cleanSpy1 = jest.spyOn(cache1, 'clean')
    const cleanSpy2 = jest.spyOn(cache2, 'clean')

    register(cache1)
    register(cache2)

    const cleanPromise = clean()
    const cleanPromise2 = clean()
    expect(cleanPromise2).toBe(cleanPromise) // only one clean at a time

    await cleanPromise
    expect(cleanSpy1).toHaveBeenCalledTimes(1)
    expect(cleanSpy2).toHaveBeenCalledTimes(1)
  })
})
