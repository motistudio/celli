import {describe, test, expect, vi} from 'vitest'

import EventEmitter from '../../../src/commons/eventEmitter/EventEmitter'
import createEventEmitter from '../../../src/commons/eventEmitter/createEventEmitter'
import subscribe from '../../../src/commons/eventEmitter/subscribe'

describe('Event Emitter', () => {
  describe('EventEmitter', () => {
    test('Should define an event emitter and emit events', () => {
      const em = new EventEmitter<{'event': [number]}>()
      const event = vi.fn()

      em.on('event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
      em.off('event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
    })

    test('Should remove only the specified listener with off()', () => {
      const em = new EventEmitter<{'event': [number]}>()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      em.on('event', listener1)
      em.on('event', listener2)

      em.emit('event', 1)
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)

      em.off('event', listener1)

      em.emit('event', 2)
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(2)
    })

    test('Should handle off() for non-existent event key', () => {
      const em = new EventEmitter<{'event': [number], 'other': [string]}>()
      const listener = vi.fn()

      // Should not throw when removing listener from non-existent key
      em.off('other', listener)

      em.on('event', listener)
      em.emit('event', 1)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test('Should handle off() for non-registered listener', () => {
      const em = new EventEmitter<{'event': [number]}>()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      em.on('event', listener1)

      // Should not throw when removing a listener that was never added
      em.off('event', listener2)

      em.emit('event', 1)
      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).not.toHaveBeenCalled()
    })
  })

  describe('Subscribe', () => {
    test('Should subscribe to event and get an un-subscribe function', () => {
      type Map = {'event': [number]}
      const em = createEventEmitter<Map>()
      const event = vi.fn()

      const unsubscribe = subscribe(em, 'event', event)
      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
      unsubscribe()

      em.emit('event', 0)
      expect(event).toHaveBeenCalledTimes(1)
    })
  })
})
