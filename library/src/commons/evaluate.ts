import isThentable from './promise/isThentable'

const evaluate = <T, U>(result: T | Promise<T>, then: (value: T) => (U | Promise<U>)): (U | Promise<U>) => {
  if (isThentable(result)) {
    return result.then(then)
  }
  return then(result)
}

export default evaluate
