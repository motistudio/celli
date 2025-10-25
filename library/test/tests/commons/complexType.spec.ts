import {describe, test, expect} from 'vitest'

import isComplexType from '../../../src/commons/isComplexType'

describe('isComplexType', () => {
  test('Should get an indication on complex types', () => {
    expect(isComplexType(() => undefined)).toBe(true)
    expect(isComplexType([])).toBe(true)
    expect(isComplexType({})).toBe(true)
    expect(isComplexType(undefined)).toBe(false)
    expect(isComplexType(null)).toBe(false)
    expect(isComplexType(NaN)).toBe(false)
    expect(isComplexType(false)).toBe(false)
    expect(isComplexType(0)).toBe(false)
    expect(isComplexType(1)).toBe(false)
    expect(isComplexType('c')).toBe(false)
    expect(isComplexType('string')).toBe(false)
    expect(isComplexType(true)).toBe(false)
  })
})
