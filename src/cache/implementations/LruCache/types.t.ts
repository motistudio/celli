import type {Key} from '../../../types/cache.t'

export type ItemSizeGetter<K extends Key, T> = (key: K, value: T) => number

export type LruCacheOptions<K extends Key, T> = {
  maxSize: number,
  getItemSize: ItemSizeGetter<K, T>
}
