import getSignatureKey from '../../../src/memoization/getSignatureKey'

describe('Memoization', () => {
  describe('getSignatureKey', () => {
    test('Should return a key for an item', () => {
      const value1 = 'text'
      const value2 = 10
      const value3 = {x: 10}
      const value4 = {x: 90}

      expect(typeof getSignatureKey(value1)).toBe('string')
      expect(typeof getSignatureKey(value2)).toBe('string')
      expect(typeof getSignatureKey(value3)).toBe('string')
      expect(typeof getSignatureKey(value4)).toBe('string')
      expect(typeof getSignatureKey()).toBe('string')

      expect(getSignatureKey()).toBe(getSignatureKey())
      expect(getSignatureKey(value3)).not.toBe(getSignatureKey(value4))
    })
  })
})
