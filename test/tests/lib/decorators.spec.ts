import {clean, Cache} from '../../../src/lib'

describe('Decorators', () => {
  test('Should cache a function', async () => {
    const method = jest.fn((number: number) => ({value: number * 2}))

    class StaticClass {
      @Cache({cacheBy: (x) => String(x), async: false, lru: 2, ttl: 100})
      static expensiveMethod(x: number) {
        return method(x)
      }
    }

    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(1)

    await clean()
    expect(StaticClass.expensiveMethod(5)).toMatchObject({value: 10})
    expect(method).toHaveBeenCalledTimes(2)
  })
})
