import type {Observable as IObservable, Observer, Listener} from '../../types/observables.t'

const removeFrom = <T>(item: T, list: T[]) => {
  const index = list.indexOf(item)
  if (index > -1) {
    list.splice(index, 1)
  }
}

class Observable<T> implements IObservable<T> {
  public listeners: Listener<T>[]
  public errorListeners: Listener<Error>[]
  public completeListeners: Listener<void>[]

  constructor () {
    this.listeners = []
    this.errorListeners = []
    this.completeListeners = []
  }

  next (value: T) {
    this.listeners.forEach((listener) => listener(value))
  }

  error (error: Error) {
    this.errorListeners.forEach((listener) => listener(error))
  }

  complete () {
    this.completeListeners.forEach((listener) => listener())

    // cleans up all the listeners
    this.listeners = []
    this.errorListeners = []
    this.completeListeners = []
  }

  subscribe (callback: Listener<T> | Observer<T>) {
    const {next, error, complete} = typeof callback === 'function' ? {next: callback} as Observer<T> : callback
    if (next) {
      this.listeners.push(next)
    }
    if (error) {
      this.errorListeners.push(error)
    }
    if (complete) {
      this.completeListeners.push(complete)
    }
    return {
      unsubscribe: () => {
        if (next) {
          removeFrom(next, this.listeners)
        }
        if (error) {
          removeFrom(error, this.errorListeners)
        }
        if (complete) {
          removeFrom(complete, this.completeListeners)
        }
      }
    }
  }
}

export default Observable
