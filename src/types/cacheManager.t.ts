import type {Unsubscribe} from './eventEmitter.t'

export type Cleanable = {
  /** Remove all entries from this cache */
  clean: () => Promise<void> | void
}

export type ClearListener = () => void

export type CacheManagerRef = any

/**
 * Manages multiple cache instances and their lifecycles.
 *
 * Provides methods to register/unregister caches, share resources between managers,
 * and clean up resources when they're no longer needed. Especially useful for managing
 * caches across different sessions or contexts within an application.
 *
 * Can manage any object that implements a `clean()` method (Cleanable), including
 * cache instances and memoized functions.
 */
export type CacheManager<T extends Cleanable = Cleanable> = {
  /** Get all registered cache entries with their refs */
  getAllResourceEntries: () => [CacheManagerRef | undefined, T][],
  /** Get a cache by its reference */
  getByRef: (ref: CacheManagerRef) => T | undefined,
  /** Register a cache with optional reference */
  register: (cache: T, ref?: CacheManagerRef) => void,
  /** Unregister a cache */
  unregister: (cache: T) => void,
  /** Clean and remove all registered caches that it doesn't share with other cache managers (force to skip cleanup and just remove the caches) */
  clear: (force?: boolean) => Promise<void>,
  /** Clean all registered caches */
  clean: () => Promise<void>,
  /** Subscribe to clear events */
  onClear: (fn: ClearListener) => Unsubscribe
}
