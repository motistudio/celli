import {describe, test, expect, vi, beforeAll, afterAll} from 'vitest'

import isThentable from '../../../src/commons/promise/isThentable'
import delay from '../../../src/commons/promise/delay'
import defer from '../../../src/commons/promise/defer'
import tick from '../../../src/commons/promise/tick'
import getPromiseState from '../../../src/commons/promise/getPromiseState'
import promisify from '../../../src/commons/promise/promisify'
import singlify from '../../../src/commons/promise/singlify'

describe('Promise utils', () => {
  describe('isThenable', () => {
    test('Should return if an argument is a thenable object', () => {
      const promise = Promise.resolve()
      const thenable = {then: () => undefined}
      const obj = {}
      const unrelatedType = 0

      expect(isThentable(promise)).toBe(true)
      expect(isThentable(thenable)).toBe(true)
      expect(isThentable(obj)).toBe(false)
      expect(isThentable(unrelatedType)).toBe(false)
    })
  })

  describe('delay', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should delay a call', async () => {
      const next = vi.fn()
      const promise = delay(1000).then(next)
      expect(isThentable(promise)).toBe(true)
      expect(next).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(next).not.toHaveBeenCalled()

      vi.runAllTimers()

      await promise

      expect(next).toHaveBeenCalled()
    })
  })

  describe('tick', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('Should wait a tick', async () => {
      const next = vi.fn()
      const promise = tick().then(next)
      expect(isThentable(promise)).toBe(true)
      expect(next).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(next).not.toHaveBeenCalled()

      vi.runAllTimers()

      await promise

      expect(next).toHaveBeenCalled()
    })
  })

  describe('defer', () => {
    test('Should create a deferred object and resolve it', () => {
      const deferred = defer()
      expect(isThentable(deferred.promise)).toBe(true)

      return new Promise((done) => {
        deferred.promise.then(done)
        deferred.resolve(undefined)
      })
    })

    test('Should create a deferred object and reject it', () => {
      const deferred = defer()
      expect(isThentable(deferred.promise)).toBe(true)

      return new Promise((done) => {
        deferred.promise.catch(done)
        deferred.reject(undefined)
      })
    })
  })

  describe('getPromiseState', () => {
    test('Should get a promise state of a promise that resolves', async () => {
      const value = 'value'
      const promise = Promise.resolve(value)

      const promiseState = getPromiseState(promise)
      expect(promiseState.promise).toBe(promise)
      expect(promiseState.resolved).toBe(false)
      expect(promiseState.rejected).toBe(false)
      expect(promiseState.finished).toBe(false)
      expect(promiseState.rejectedError).toBe(undefined)
      expect(promiseState.resolvedValue).toBe(undefined)

      await promise

      expect(promiseState.resolved).toBe(true)
      expect(promiseState.rejected).toBe(false)
      expect(promiseState.finished).toBe(true)
      expect(promiseState.rejectedError).toBe(undefined)
      expect(promiseState.resolvedValue).toBe(value)
    })

    test('Should get a promise state of a promise that rejects', async () => {
      const error = new Error('Rejection!')
      const promise = Promise.reject(error)

      const promiseState = getPromiseState(promise)
      expect(promiseState.resolved).toBe(false)
      expect(promiseState.rejected).toBe(false)
      expect(promiseState.finished).toBe(false)
      expect(promiseState.rejectedError).toBe(undefined)
      expect(promiseState.resolvedValue).toBe(undefined)

      await Promise.allSettled([promise])

      expect(promiseState.resolved).toBe(false)
      expect(promiseState.rejected).toBe(true)
      expect(promiseState.finished).toBe(true)
      expect(promiseState.rejectedError).toBe(error)
      expect(promiseState.resolvedValue).toBe(undefined)
    })
  })

  describe('promisify', () => {
    test('Should make a sync value a promise', async () => {
      const value = 1
      const promise = promisify(value)
      expect(isThentable(promise)).toBe(true)
      await expect(promise).resolves.toBe(value)
    })

    test('Should return a promise if given', async () => {
      const value = 1
      const initialPromise = Promise.resolve(value)
      const promise = promisify(initialPromise)
      expect(isThentable(promise)).toBe(true)
      expect(promise).toBe(initialPromise)
      await expect(promise).resolves.toBe(value)
    })
  })

  describe('Singlify', () => {
    test('Should have a single promise out of function', async () => {
      const value = 'value'
      const fn = vi.fn(() => Promise.resolve(value))

      const getValue = singlify(fn)

      const promise = getValue()
      const promise2 = getValue()
      expect(promise2).toBe(promise)

      await expect(promise).resolves.toBe(value)

      const promise3 = getValue()
      expect(promise3).not.toBe(promise) // after the promise is resolved, it is no longer cached
      await expect(promise3).resolves.toBe(value)
    })

    test('Should have a single promise in cases of failures too', async () => {
      const fn = vi.fn(() => Promise.reject(new Error('Simulated test error')))

      const getValue = singlify(fn)

      const promise = getValue()
      const promise2 = getValue()
      expect(promise2).toBe(promise)

      await expect(promise).rejects.toThrow()

      const promise3 = getValue()
      expect(promise3).not.toBe(promise) // after the promise is resolved, it is no longer cached
      await expect(promise3).rejects.toThrow()
    })
  })
})
