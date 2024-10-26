import type {
  EventMap,
  EventEmitter,
  EventListener,
  EventMapKey
} from '../../types/eventEmitter.t'

type Unsubscribe = () => void

const subscribe = <M extends EventMap, K extends EventMapKey<M> = EventMapKey<M>, E extends EventEmitter<M> = EventEmitter<M>>(eventEmitter: E, eventName: K, listener: EventListener<M[K]>): Unsubscribe => {
  eventEmitter.on(eventName, listener)
  return () => {
    eventEmitter.off(eventName, listener)
  }
}

export default subscribe
