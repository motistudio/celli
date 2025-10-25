type PromiseState<T> = {
  promise: Promise<T>,
  resolved: boolean,
  rejected: boolean,
  finished: boolean,
  resolvedValue?: T,
  rejectedError?: Error
}

/**
 * Returns an object representing the promise state
 * This is used mostly for tests
 * @param {Promise<any>} promise - any promise
 * @returns {PromiseState}
 */
const getPromiseState = <T>(promise: Promise<T>): PromiseState<T> => {
  const promiseState: PromiseState<T> = {
    promise,
    resolved: false,
    rejected: false,
    finished: false
  }

  promise.then((result) => {
    promiseState.resolved = true
    promiseState.finished = true
    promiseState.resolvedValue = result
  }, (e) => {
    promiseState.rejected = true
    promiseState.finished = true
    promiseState.rejectedError = e
  })

  return {
    get promise () {
      return promiseState.promise
    },
    get resolved () {
      return promiseState.resolved
    },
    get rejected () {
      return promiseState.rejected
    },
    get finished () {
      return promiseState.finished
    },
    get resolvedValue () {
      return promiseState.resolvedValue
    },
    get rejectedError () {
      return promiseState.rejectedError
    }
  }
}

export default getPromiseState
