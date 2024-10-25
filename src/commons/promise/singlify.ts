import type {Fn} from '../../types/commons.t'

const singlify = <F extends Fn<any[], Promise<any>>>(fn: F): F => {
  let promise: ReturnType<F> | undefined = undefined

  return (function (this: ThisType<F> | void, ...args: Parameters<F>) {
    if (promise) {
      return promise as ReturnType<F>
    }
    promise = Promise.resolve(fn.apply(this, args)).then((result) => {
      promise = undefined
      return result
    }).catch((e) => {
      promise = undefined
      return Promise.reject(e)
    }) as ReturnType<F>

    return promise
  }) as unknown as F
}

export default singlify
