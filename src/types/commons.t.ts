export type Merge<T extends object, U extends object> = Omit<T, keyof U> & U

export type AnyFunction = (...args: any) => any

export type Fn<P extends any[] = any[], R = any> = (...args: P) => R
