import type {
  EventMap,
  EventEmitter as IEventEmitter,
  EventKey,
  EventListener
} from '../../types/eventEmitter.t'

type Listener<T extends EventMap, K extends keyof T> = ((...params: T[K]) => void)

type ListenersMap<T extends EventMap> = {
  [K in keyof T]?: Listener<T, K>[]
}

class EventEmitter<T extends EventMap> implements IEventEmitter<T> {
  public listeners: ListenersMap<T>
  constructor () {
    this.listeners = {}
  }

  on <K extends EventKey<T>>(key: K, fn: EventListener<T[K]>) {
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(fn)
  }

  off <K extends EventKey<T>>(key: K, fn: EventListener<T[K]>) {
    if (key in this.listeners) {
      const index = (this.listeners[key] as Listener<T, K>[]).indexOf(fn)
      if (index > -1) {
        (this.listeners[key] as Listener<T, K>[]).splice(index, 1)
      }
    }
  }

  emit <K extends EventKey<T>>(key: K, ...params: T[K]) {
    this.listeners[key]?.forEach((callback) => {
      callback(...params)
    })
  }
}

export default EventEmitter
