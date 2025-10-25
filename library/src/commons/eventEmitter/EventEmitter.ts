import type {
  EventMap,
  EventEmitter as IEventEmitter,
  EventMapKey,
  EventListener
} from '../../types/eventEmitter.t'

type Listener<T extends EventMap, K extends keyof T> = ((...params: T[K]) => void)

type ListenersMap<T extends EventMap> = {
  [K in keyof T]?: Listener<T, K>[]
}

class EventEmitter<M extends EventMap> implements IEventEmitter<M> {
  public listeners: ListenersMap<M>
  constructor () {
    this.listeners = {}
  }

  on <K extends EventMapKey<M>>(key: K, fn: EventListener<M[K]>) {
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(fn)
  }

  off <K extends EventMapKey<M>>(key: K, fn: EventListener<M[K]>) {
    if (key in this.listeners) {
      const index = (this.listeners[key] as Listener<M, K>[]).indexOf(fn)
      if (index > -1) {
        (this.listeners[key] as Listener<M, K>[]).splice(index, 1)
      }
    }
  }

  emit <K extends EventMapKey<M>>(key: K, ...params: M[K]) {
    this.listeners[key]?.forEach((callback) => {
      callback(...params)
    })
  }
}

export default EventEmitter
