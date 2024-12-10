import type {Unsubscribe} from './eventEmitter.t'

export type Cleanable = {
  clean: () => Promise<void> | void
}

export type ClearListener = () => void

export type CacheManagerRef = any

export type CacheManager<T extends Cleanable = Cleanable> = {
  getAllResourceEntries: () => [CacheManagerRef | undefined, T][],
  getByRef: (ref: CacheManagerRef) => T | undefined,
  register: (cache: T, ref?: CacheManagerRef) => void,
  unregister: (cache: T) => void,
  clear: (force?: boolean) => Promise<void>,
  clean: () => Promise<void>,
  onClear: (fn: ClearListener) => Unsubscribe
}
