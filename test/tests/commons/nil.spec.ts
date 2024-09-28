import isNil from '../../../src/commons/isNil'

describe('Is Nil', () => {
  test('Should return nil indication for nil values', () => {
    expect(isNil(undefined)).toBe(true)
    expect(isNil(null)).toBe(true)
    expect(isNil(NaN)).toBe(true)
    expect(isNil('str')).toBe(false)
    expect(isNil(123)).toBe(false)
    expect(isNil({})).toBe(false)
  })
})
