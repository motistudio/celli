export type Cleanup = () => void | Promise<void>

type EffectCallbackApi<T> = {
  remove: () => void,
  get: () => T
}

type EffectApi<T> = {
  onRead: (callback: ((utils: EffectCallbackApi<T>) => void)) => void
}

export type Effect<T> = (value: T, utils: EffectApi<T>) => void | Cleanup;
