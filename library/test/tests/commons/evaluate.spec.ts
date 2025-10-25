import {describe, test, expect} from 'vitest'

import evaluate from '../../../src/commons/evaluate'
import isThentable from '../../../src/commons/promise/isThentable'

describe('Evaluate', () => {
  test('Should evaluate a sync value', () => {
    const value: number = 1
    const transformer = (param: typeof value) => param * 2
    const result = evaluate(value, transformer)
    expect(isThentable(result)).toBe(false)
    expect(result).toBe(2)
  })

  test('Should evaluate an async value', async () => {
    const value: number = 1
    const transformer = (param: typeof value) => param * 2
    const result = evaluate(Promise.resolve(value), transformer)
    expect(isThentable(result)).toBe(true)
    await expect(result).resolves.toBe(2)
  })
})
