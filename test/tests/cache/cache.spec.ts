import Cache from '../../../src/cache/Cache'

describe('Synchronous cache', () => {
  test('Should create a simple cache', () => {
    const cache = new Cache()

    const key = 'k'
    const value = 'val'
    const value2 = 'val2'

    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)
    
    cache.set(key, value)
    
    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value)
    
    cache.set(key, value2)
    expect(cache.has(key)).toBe(true)
    expect(cache.get(key)).toBe(value2)
    
    cache.delete(key)
    expect(cache.has(key)).toBe(false)
    expect(cache.get(key)).toBe(undefined)
  })

  test('Should get key and values', () => {
    const cache = new Cache()

    const entrySet = [['k1', 'v1'], ['k2', 'v2'], ['k3', 'v3']]

    entrySet.forEach(([key, value]) => {
      cache.set(key, value)
    })

    const keys = cache.keys()
    const values = cache.values()
    const entries = cache.entries()

    expect(keys.next).toBeTruthy()
    expect(values.next).toBeTruthy()
    expect(entries.next).toBeTruthy()

    expect(Array.from(keys)).toMatchObject(entrySet.map(([key]) => key))
    expect(Array.from(values)).toMatchObject(entrySet.map(([, value]) => value))
    expect(Array.from(entries)).toMatchObject(entrySet)
    expect(Array.from(cache)).toMatchObject(entrySet)
  })

  test.each([new Cache(), new Cache(new Cache())])('Should get cache cleaned', (cache) => {
    const values = {x: 1, y: 2, z: 3}
    Object.entries(values).forEach(([key, value]) => cache.set(key, value))

    expect(Object.keys(values).every((key) => cache.has(key))).toBe(true)

    cache.clean()

    expect(Object.keys(values).every((key) => !cache.has(key))).toBe(true)
  })
})
