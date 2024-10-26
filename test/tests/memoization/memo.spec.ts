import memo from '../../../src/memoization/memo'

describe('Memo', () => {
  test('Should cache a simple sync function', () => {
    const fn = jest.fn((a: number, b: number) => a + b)
    const memoized = memo(fn)

    expect(memoized(1, 1)).toBe(2)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1, 1)
    expect(memoized(1, 1)).toBe(2)
    expect(fn).toHaveBeenCalledTimes(1) // original function still happened only once

    expect(memoized(1, 2)).toBe(3)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(memoized(1, 2)).toBe(3)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('Should cache an async function', async () => {
    const fn = jest.fn((a: number, b: number) => Promise.resolve(a + b))
    const memoized = memo(fn)

    await expect(memoized(1, 1)).resolves.toBe(2)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1, 1)
    await expect(memoized(1, 1)).resolves.toBe(2)
    expect(fn).toHaveBeenCalledTimes(1) // original function still happened only once

    await expect(memoized(1, 2)).resolves.toBe(3)
    expect(fn).toHaveBeenCalledTimes(2)
    await expect(memoized(1, 2)).resolves.toBe(3)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('Should cache promises on async functions', async () => {
    const value = 'value'

    const success = jest.fn(() => Promise.resolve(value))
    const failure = jest.fn(() => Promise.reject(new Error('Simulated test error')))

    const memoizedSuccess = memo(success)
    const memoizedFailure = memo(failure)

    const successPromise = memoizedSuccess()
    const successPromise2 = memoizedSuccess()
    expect(successPromise2).toBe(successPromise)
    await expect(successPromise).resolves.toBe(value)

    const successPromise3 = memoizedSuccess()
    expect(successPromise3).not.toBe(successPromise)
    await expect(successPromise3).resolves.toBe(value)

    const failurePromise = memoizedFailure()
    const failurePromise2 = memoizedFailure()
    expect(failurePromise2).toBe(failurePromise)
    await expect(failurePromise).rejects.toThrow()

    const failurePromise3 = memoizedFailure()
    expect(failurePromise3).not.toBe(failurePromise)
    await expect(failurePromise3).rejects.toThrow()
  })
})
