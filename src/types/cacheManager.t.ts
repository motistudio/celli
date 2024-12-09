import type {Unsubscribe} from './eventEmitter.t'

export type Cleanable = {
  clean: () => Promise<void> | void
}

export type ClearListener = () => void

export type CacheManager<T extends Cleanable = Cleanable> = {
  getByRef: (ref: any) => T | undefined,
  register: (cache: T, ref?: any) => void,
  unregister: (cache: T) => void,
  clear: (force?: boolean) => Promise<void>,
  clean: () => Promise<void>,
  onClear: (fn: ClearListener) => Unsubscribe
}
