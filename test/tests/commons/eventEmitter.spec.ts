import EventEmitter from '../../../src/commons/eventEmitter/EventEmitter'
import createEventEmitter from '../../../src/commons/eventEmitter/createEventEmitter'
import subscribe from '../../../src/commons/eventEmitter/subscribe'

describe('Event Emitter', () => {
  describe('EventEmitter', () => {
    test('Should define an event emitter and emit events', () => {
      const em = new EventEmitter<{'event': [number]}>()
      const event = jest.fn()
  
      em.on('event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
      em.off('event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
    })
  })

  describe('Subscribe', () => {
    test('Should subscribe to event and get an un-subscribe function', () => {
      type Map = {'event': [number]}
      const em = createEventEmitter<Map>()
      const event = jest.fn()
  
      const unsubscribe = subscribe(em, 'event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
      unsubscribe()

      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
    })
  })
})
