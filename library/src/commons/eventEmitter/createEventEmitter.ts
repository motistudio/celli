import type {EventMap, EventEmitter as IEventEmitter} from '../../types/eventEmitter.t'

import EventEmitter from './EventEmitter'

const createEventEmitter = <M extends EventMap>() => {
  return new EventEmitter<M>() as IEventEmitter<M>
}

export default createEventEmitter
