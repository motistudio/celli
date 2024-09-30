import type {Merge, AnyFunction} from './commons.t'

export type Cleanup = () => void | Promise<void>

export type EffectCallbackApi<T> = {
  // remove: () => void,
  get: () => T
}

export type EffectApi<T> = {
  getSelf: () => T
  setSelf: (value: T) => void
  deleteSelf: () => Promise<void> | void
  onRead: (callback: ((utils: EffectCallbackApi<T>) => void)) => void
}

export type AsyncEffectApi<T> = Merge<EffectApi<T>, {
  setSelf: (value: T) => Promise<void>
}>

// export type AbstractEffectApi<T> = EffectApi<T> & AsyncEffectApi<T>
export type AbstractEffectApi<T> = {
  [K in keyof EffectApi<T>]: EffectApi<T>[K] extends AnyFunction ? AsyncEffectApi<T>[K] extends AnyFunction ? (...args: Parameters<EffectApi<T>[K]>) => ReturnType<EffectApi<T>[K]> | ReturnType<AsyncEffectApi<T>[K]> : never : never
}

export type Effect<T> = (utils: AbstractEffectApi<T>) => Cleanup | void
