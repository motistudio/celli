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
  })
})
