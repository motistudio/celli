import type {Merge, Fn} from './commons.t'

export type Cleanup = () => void | Promise<void>

export type EffectApi<T> = {
  getSelf: () => T
  deleteSelf: () => Promise<void> | void
  onRead: (callback: (() => void)) => void
}

export type AsyncEffectApi<T> = Merge<EffectApi<T>, {
  setSelf: (value: T) => Promise<void>
}>

// export type AbstractEffectApi<T> = EffectApi<T> & AsyncEffectApi<T>
export type AbstractEffectApi<T> = {
  [K in keyof EffectApi<T>]: EffectApi<T>[K] extends Fn ? AsyncEffectApi<T>[K] extends Fn ? (...args: Parameters<EffectApi<T>[K]>) => ReturnType<EffectApi<T>[K]> | ReturnType<AsyncEffectApi<T>[K]> : never : never
}

export type Effect<T> = (utils: AbstractEffectApi<T>) => Cleanup | void
