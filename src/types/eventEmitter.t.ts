export type EventMap = Record<string, any[]>

export type EventKey<M extends EventMap> = keyof M
export type EventListener<T extends any[]> = (...params: T) => void

export interface EventEmitter<M extends EventMap> {
  on<K extends EventKey<M>>(eventName: K, listener: EventListener<M[K]>): void
  off<K extends EventKey<M>>(eventName: K, listener: EventListener<M[K]>): void
  emit<K extends EventKey<M>>(eventName: K, ...params: M[K]): void
}
