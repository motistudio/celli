type AnySingleParamFunction = (arg: any) => any

/**
 * Composes multiple single-parameter functions into a single function.
 *
 * Executes functions from right to left (last to first). Useful for combining
 * cache transformers and other functional operations.
 *
 * @param {...AnySingleParamFunction} callbacks - Functions to compose
 * @returns {AnySingleParamFunction} Composed function
 */
function compose <
  T extends AnySingleParamFunction,
  U extends (arg: ReturnType<T>) => any,
  V extends (arg: ReturnType<U>) => any,
  X extends (arg: ReturnType<U>) => any,
  Z extends (arg: ReturnType<U>) => any
>(f: U, g: T, h: V, i: X, j: Z): (x: Parameters<T>[0]) => ReturnType<Z>
function compose <
  T extends AnySingleParamFunction,
  U extends (arg: ReturnType<T>) => any,
  V extends (arg: ReturnType<U>) => any,
  X extends (arg: ReturnType<U>) => any
>(f: U, g: T, h: V, i: X): (x: Parameters<T>[0]) => ReturnType<X>
function compose <
  T extends AnySingleParamFunction,
  U extends (arg: ReturnType<T>) => any,
  V extends (arg: ReturnType<U>) => any
>(f: U, g: T, h: V): (x: Parameters<T>[0]) => ReturnType<V>
function compose <T extends AnySingleParamFunction, U extends (arg: ReturnType<T>) => any>(f: U, g: T): (x: Parameters<T>[0]) => ReturnType<U>
function compose <T extends AnySingleParamFunction>(callback: T, ...callbacks: T[]): T {
  return callbacks.reduce<T>((fn, nextFn) => {
    return ((value) => fn(nextFn(value))) as T
  }, callback)
}

export default compose
