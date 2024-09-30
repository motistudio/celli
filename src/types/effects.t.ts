export type Cleanup = () => void | Promise<void>

type EffectCallbackApi<T> = {
  remove: () => void,
  get: () => T
}

export type EffectApi<T> = {
  getSelf: () => T
  setSelf: (value: T) => Promise<void> | void
  deleteSelf: () => Promise<void> | void
  onRead: (callback: ((utils: EffectCallbackApi<T>) => void)) => void
}

export type Effect<T> = (value: T, utils: EffectApi<T>) => void | Cleanup
