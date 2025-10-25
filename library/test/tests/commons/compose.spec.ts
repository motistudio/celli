import {describe, test, expect} from 'vitest'

import compose from '../../../src/commons/compose'

describe('Compose', () => {
  test('Should compose functions', () => {
    const a = (x: number) => `${x}${x}`
    const b = (x: number) => x * 2

    const multiply = compose(a, b)

    const input = 10

    expect(multiply(input)).toBe(a(b(input)))
  })
})
