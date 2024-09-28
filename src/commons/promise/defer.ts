type Resolve<T> = (value: T | PromiseLike<T>) => void
type Reject = (reason?: any) => void

const defer = <T>() => {
  let resolveHandler: Resolve<T>
  let rejectHandler: Reject
  const promise = new Promise<T>((resolve, reject) => {
    resolveHandler = resolve
    rejectHandler = reject
  })

  return {
    resolve: ((...args) => resolveHandler(...args)) as Resolve<T>,
    reject: ((...args) => rejectHandler(...args)) as Reject,
    promise
  }
}

export default defer
