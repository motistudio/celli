export type Merge<T extends object, U extends object> = Omit<T, keyof U> & U

export type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {}

export type AnyFunction = (...args: any) => any

export type Fn<P extends any[] = any[], R = any> = (...args: P) => R
