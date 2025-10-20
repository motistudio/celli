import type {Unsubscribe} from './eventEmitter.t'

export type Cleanable = {
  /** Remove all entries from this cache */
  clean: () => Promise<void> | void
}

export type ClearListener = () => void

export type CacheManagerRef = any

export type CacheManager<T extends Cleanable = Cleanable> = {
  /** Get all registered cache entries with their refs */
  getAllResourceEntries: () => [CacheManagerRef | undefined, T][],
  /** Get a cache by its reference */
  getByRef: (ref: CacheManagerRef) => T | undefined,
  /** Register a cache with optional reference */
  register: (cache: T, ref?: CacheManagerRef) => void,
  /** Unregister a cache */
  unregister: (cache: T) => void,
  /** Clear all registered caches (force to skip cleanup) */
  clear: (force?: boolean) => Promise<void>,
  /** Clean all registered caches */
  clean: () => Promise<void>,
  /** Subscribe to clear events */
  onClear: (fn: ClearListener) => Unsubscribe
}
