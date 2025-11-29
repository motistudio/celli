import {describe, test, expect, vi} from 'vitest'

import Observable from '../../../src/commons/observables/Observable'

describe('Observables', () => {
  describe('Observable', () => {
    test('Should create an observable and fire its events', () => {
      const observable = new Observable<number>()
      const err = new Error('Oops')

      const next = vi.fn()
      const error = vi.fn()
      const complete = vi.fn()

      const subscription = observable.subscribe({next, error, complete})

      observable.next(1)

      expect(next).toHaveBeenCalledWith(1)
      expect(next).toHaveBeenCalledTimes(1)

      observable.error(err)
      expect(error).toHaveBeenCalledWith(err)

      observable.complete()
      expect(complete).toHaveBeenCalled()

      observable.next(2)

      expect(next).toHaveBeenCalledTimes(1) // still only 1, no event will be fired after complete()

      subscription.unsubscribe()
    })

    test('Should subscribe for a simple callback', () => {
      const observable = new Observable<number>()

      const callback = vi.fn()
      const subscription = observable.subscribe(callback)

      observable.next(1)

      expect(callback).toHaveBeenCalledWith(1)

      subscription.unsubscribe()
    })

    test('Should handle subscription with only error and complete callbacks', () => {
      const observable = new Observable<number>()
      const err = new Error('Test error')

      const error = vi.fn()
      const complete = vi.fn()

      // Subscribe without a next callback (pass undefined explicitly)
      const subscription = observable.subscribe({next: undefined as unknown as (value: number) => void, error, complete})

      // next should not throw when there's no next listener
      observable.next(1)

      // error and complete should still work
      observable.error(err)
      expect(error).toHaveBeenCalledWith(err)

      observable.complete()
      expect(complete).toHaveBeenCalled()

      subscription.unsubscribe()
    })
  })
})
