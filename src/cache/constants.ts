// General inner cache key, used across implementations
export const CACHE_KEY = Symbol.for('cache')

export const GET_PROMISES_KEY = Symbol.for('cache-promise-getter')
export const SET_PROMISES_KEY = Symbol.for('cache-promise-setter')
export const HAS_PROMISES_KEY = Symbol.for('cache-promise-has')
export const DELETE_PROMISES_KEY = Symbol.for('cache-values-delete')

export const EVENT_EMITTER_KEY = Symbol.for('event-emitter')

// Observables for specific events
export const SET_OBSERVABLE = Symbol.for('set-observable')
export const DELETE_OBSERVABLE = Symbol.for('delete-observable')
export const CLEAN_OBSERVABLE = Symbol.for('clean-observable')
