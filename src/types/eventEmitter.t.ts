export type EventMap = Record<string, any[]>

export type EventMapKey<M extends EventMap> = string & keyof M
export type EventListener<T extends any[]> = (...params: T) => void

export interface EventEmitter<M extends EventMap = EventMap> {
  on<K extends EventMapKey<M>>(eventName: K, listener: EventListener<M[K]>): void
  off<K extends EventMapKey<M>>(eventName: K, listener: EventListener<M[K]>): void
  emit<K extends EventMapKey<M>>(eventName: K, ...params: M[K]): void
}

export type EventEmitterMap<E extends EventEmitter> = E extends EventEmitter<infer M> ? M : never

export type EventEmitterKey<E extends EventEmitter> = keyof EventEmitterMap<E>

export type EventEmitterListener<
  E extends EventEmitter<EventMap>,
  K extends EventEmitterKey<E> = EventEmitterKey<E>
> = EventListener<EventEmitterMap<E>[K]>

export type Unsubscribe = () => void
