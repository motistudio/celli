import {clean, memo} from '../../../src/lib'

describe('Memoization', () => {
  test('Should memoize a function', async () => {
    const fn = jest.fn(() => 'v')
    const memoized = memo(fn)

    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)

    await clean()
    expect(memoized()).toBe('v')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
