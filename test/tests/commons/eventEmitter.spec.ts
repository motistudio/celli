import EventEmitter from '../../../src/commons/eventEmitter/EventEmitter'

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
