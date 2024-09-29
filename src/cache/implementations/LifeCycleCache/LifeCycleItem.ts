import type {Effect, Cleanup, EffectApi} from '../../../types/effects.t'
import type {Observable as IObservable} from '../../../types/observables.t'

import Observable from '../../../commons/observables/Observable'

import createCleanup from './createCleanup'
import isThentable from '../../../commons/promise/isThentable'

class LifeCycleItem<T> {
  public isCleaned: boolean
  public lastValue: T
  public cleanup: Cleanup
  public stream: IObservable<T>

  constructor (effects: Effect<T>[], initialValue: T, setSelf: (value: T) => Promise<void> | void, removeSelf: () => void) {
    this.lastValue = initialValue
    this.isCleaned = false
    this.stream = new Observable<T>()

    const api: Omit<EffectApi<T>, 'onRead'> = {
      getSelf: () => this.lastValue,
      setSelf: (value) => {
        const result = setSelf(value)
        if (isThentable(result)) {
          return result.then((val) => {
            this.lastValue = value
            return val
          })
        }
        this.lastValue = value
        return undefined
      },
      deleteSelf: () => {
        if (!this.isCleaned) {
          removeSelf()
        }
      }
    }

    this.cleanup = createCleanup(api, this.stream, initialValue, effects)
  }

  read (value: T) {
    this.lastValue = value
    this.stream.next(value)
  }

  clean () {
    if (!this.isCleaned) {
      this.isCleaned = true
      return this.cleanup()
    }
  }
}

export default LifeCycleItem
