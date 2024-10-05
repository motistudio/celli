import createSource from '../../../src/cache/createSource'
import Cache from '../../../src/cache/implementations/Cache'

describe('Source Cache', () => {
  test('Should create a simple SourceCache', async () => {
    const cache = new Cache()
    const source = createSource({
      get: (key) => cache.get(key),
      has: (key) => cache.has(key),
      set: (key, value) => cache.set(key, value),
      delete: (key) => cache.delete(key),
      keys: () => cache.keys(),
      values: () => cache.values(),
      entries: () => cache.entries(),
      clean: () => cache.clean()
    })

    const key = 'key'
    const value = 'value'

    await source.set(key, value)
    await expect(source.get(key)).resolves.toBe(value)
    await expect(source.has(key)).resolves.toBe(true)
    await source.delete(key)
    await expect(source.has(key)).resolves.toBe(false)

    await source.set(key, value)
    await expect(Array.fromAsync(source.keys())).resolves.toMatchObject([key])
    await expect(Array.fromAsync(source.values())).resolves.toMatchObject([value])
    await expect(Array.fromAsync(source.entries())).resolves.toMatchObject([[key, value]])
    await expect(Array.fromAsync(source)).resolves.toMatchObject([[key, value]])

    await source.clean()
    await expect(source.has(key)).resolves.toBe(false)
  })

  test('Should create a SourceCache with only get', async () => {
    const cache = new Cache()

    const key = 'key'
    const value = 'value'

    cache.set(key, value)

    const source = createSource({
      get: (key) => cache.get(key)
    })

    await expect(source.get(key)).resolves.toBe(value)
    await expect(source.has(key)).resolves.toBe(true)
    await source.delete(key)
    await expect(source.has(key)).resolves.toBe(false)
    expect(cache.has(key)).toBe(true) // wasn't deleted from the original cache

    await source.set(key, value)
    await expect(Array.fromAsync(source.keys())).resolves.toMatchObject([key])
    await expect(Array.fromAsync(source.values())).resolves.toMatchObject([value])
    await expect(Array.fromAsync(source.entries())).resolves.toMatchObject([[key, value]])
    await expect(Array.fromAsync(source)).resolves.toMatchObject([[key, value]])

    await source.clean()
    await expect(source.has(key)).resolves.toBe(false)
  })
})
