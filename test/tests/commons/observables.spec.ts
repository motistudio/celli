import Observable from '../../../src/commons/observables/Observable'

describe('Observables', () => {
  describe('Observable', () => {
    test('Should create an observable and fire its events', () => {
      const observable = new Observable<number>()
      const err = new Error('Oops')

      const next = jest.fn()
      const error = jest.fn()
      const complete = jest.fn()

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

      const callback = jest.fn()
      const subscription = observable.subscribe(callback)

      observable.next(1)

      expect(callback).toHaveBeenCalledWith(1)

      subscription.unsubscribe()
    })
  })
})
