import once from '../../../src/commons/once'

describe('Once', () => {
  test('Should cache a sync function', () => {
    const value = 'test'
    const fn = jest.fn(() => value)

    const onceFn = once(fn)
    expect(onceFn()).toBe(value) // first call
    expect(fn).toHaveBeenCalledTimes(1)
    expect(onceFn()).toBe(value) // second call
    expect(fn).toHaveBeenCalledTimes(1) // still only one call
    
    onceFn.clean()
    expect(onceFn()).toBe(value) // first call after clean
    expect(fn).toHaveBeenCalledTimes(2) // one more call to the original function
    expect(onceFn()).toBe(value) // second call
    expect(fn).toHaveBeenCalledTimes(2) // still the same number of calls
  })

  test('Should cache an async function', async () => {
    const value = 'test'
    const fn = jest.fn(() => Promise.resolve(value))
    const onceFn = once(fn)

    const promise = onceFn()
    const secondPromise = onceFn()
    expect(secondPromise).toBe(promise) // caches the active promise

    await expect(promise).resolves.toBe(value) // first call ended
    expect(fn).toHaveBeenCalledTimes(1)
    
    await expect(onceFn()).resolves.toBe(value)
    expect(fn).toHaveBeenCalledTimes(1) // still only one call
  })

  test('Should not cache an async call if it failed', async () => {
    const fn = jest.fn(() => Promise.reject(new Error('Simulated error')))
    const onceFn = once(fn)

    await expect(() => onceFn()).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
    await expect(() => onceFn()).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
