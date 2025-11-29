import {describe, test, expect, vi, beforeAll, afterAll} from 'vitest'

import createTimeout from '../../../src/commons/scheduling/createTimeout'
import createImmediate from '../../../src/commons/scheduling/createImmediate'

describe('Scheduling', () => {
  describe('createTimeout', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })
    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should create a timeout', () => {
      const callback = vi.fn()
      const timeout = createTimeout(callback, 1000)
      expect(timeout).toBeDefined()
      expect(callback).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalled()
    })

    test('Should handle environments where unref is not available', () => {
      const originalSetTimeout = globalThis.setTimeout
      const callback = vi.fn()

      // Mock setTimeout to return a timeout object without unref (old Node versions)
      vi.stubGlobal('setTimeout', (cb: () => void, ms: number) => {
        const timeoutId = originalSetTimeout(cb, ms)
        return {
          ...timeoutId,
          unref: undefined,
          ref: timeoutId.ref?.bind(timeoutId)
        }
      })

      // Should not throw when unref is undefined
      const timeout = createTimeout(callback, 1000)
      expect(timeout).toBeDefined()
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })
  })

  describe('createImmediate', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })
    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should create an immediate', () => {
      const callback = vi.fn()
      const immediate = createImmediate(callback)
      expect(immediate).toBeDefined()
      expect(callback).not.toHaveBeenCalled()
      vi.runAllTimers()
      expect(callback).toHaveBeenCalled()
    })

    test('Should handle environments where unref is not available', () => {
      const originalSetImmediate = globalThis.setImmediate
      const callback = vi.fn()

      // Mock setImmediate to return an immediate object without unref (old Node versions)
      vi.stubGlobal('setImmediate', (cb: () => void) => {
        const immediateId = originalSetImmediate(cb)
        return {
          ...immediateId,
          unref: undefined,
          ref: immediateId.ref?.bind(immediateId)
        }
      })

      // Should not throw when unref is undefined
      const immediate = createImmediate(callback)
      expect(immediate).toBeDefined()
      expect(callback).not.toHaveBeenCalled()

      vi.runAllTimers()
      expect(callback).toHaveBeenCalled()

      vi.unstubAllGlobals()
    })
  })
})
