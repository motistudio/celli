import type {Key, Cache, AsyncCache} from '../../types/cache.t'

export type SourceOptions<K extends Key, T> = {
  // get: Cache<K, T>['get'] | AsyncCache<K, T>['get'],
  get: (key: K) => T | undefined | Promise<T | undefined>,
  set?: Cache<K, T>['set'] | AsyncCache<K, T>['set'],
  has?: Cache<K, T>['has'] | AsyncCache<K, T>['has'],
  delete?: Cache<K, T>['delete'] | AsyncCache<K, T>['delete'],
  keys?: Cache<K, T>['keys'] | AsyncCache<K, T>['keys'],
  values?: Cache<K, T>['values'] | AsyncCache<K, T>['values'],
  entries?: Cache<K, T>['entries'] | AsyncCache<K, T>['entries'],
  clean?: Cache<K, T>['clean'] | AsyncCache<K, T>['clean']
}

export const OPTIONS_KEY = Symbol.for('source-cache-options')
