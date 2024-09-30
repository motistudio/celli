import type {
  Key,
  AbstractCache as IAbstractCache,
  AsyncInnerCache
} from '../../../types/cache.t'
import type {Effect} from '../../../types/effects.t'

import {CACHE_KEY as MAIN_CACHE_KEY} from '../../constants'

export const CACHE_KEY = MAIN_CACHE_KEY

// lifecycle cache specific
export const CLEANUP_QUEUE = Symbol.for('cache-cleanup-queue')
export const DELETE_QUEUE = Symbol.for('cache-delete-queue')
export const LIFECYCLE_ITEMS_KEY = Symbol.for('cache-effects')

// lifecycle cache internals
export const REMOTE_REF = Symbol.for('lifecycle-cache-remote-ref')
export const INTERNAL_REMOTE_READ = Symbol.for('lifecycle-cache-remote-read')
export const INTERNAL_REMOTE_CLEAN = Symbol.for('lifecycle-cache-remote-clean')
 
export interface LifeCycleCache<K extends Key, T> extends IAbstractCache<K, T> {
  [MAIN_CACHE_KEY]: AsyncInnerCache<K, T>
  set: (key: K, value: T, effects?: Effect<T>[]) => ReturnType<IAbstractCache<K, T>['set']>
}
