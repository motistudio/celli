import type {Fn} from '../../types/commons.t'

const singlify = <C extends Fn<any[], Promise<any>>>(fn: C): C => {
  let promise: ReturnType<C> | undefined = undefined

  return ((...args: Parameters<C>) => {
    if (promise) {
      return promise as ReturnType<C>
    }
    promise = Promise.resolve(fn(...args)).then((result) => {
      promise = undefined
      return result
    }).catch((e) => {
      promise = undefined
      return Promise.reject(e)
    }) as ReturnType<C>

    return promise
  }) as unknown as C
}

export default singlify
