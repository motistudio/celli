import type {Fn} from './commons.t'
import type {AnyCacheType} from './cache.t'

export type FnCache<F extends Fn> = AnyCacheType<string, Awaited<ReturnType<F>>>

export type CacheBy<F extends Fn> = (this: ThisType<F> | void, ...args: Parameters<F>) => string
export type CacheFrom<F extends Fn> = (this: ThisType<F> | void, ...args: Parameters<F>) => FnCache<F>
export type CachePer<F extends Fn> = (...args: Parameters<F>) => unknown

export type MemoizedFn<F extends Fn> = {
  (this: ThisType<F> | void, ...args: Parameters<F>): ReturnType<F>
  clean: () => void | Promise<void>
}
