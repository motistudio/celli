type AnySingleParamFunction = (arg: any) => any

// function compose <T, U, V, Y, X>(f: (x: T) => U, g: (y: Y) => T, h: (z: V) => Y, i: (a: Y) => X): (x: X) => U
// function compose <T, U, V, Y>(f: (x: T) => U, g: (y: Y) => T, h: (z: V) => Y): (x: V) => U
// function compose <T, U, V>(f: (x: T) => U, g: (y: V) => T): (x: V) => U
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
