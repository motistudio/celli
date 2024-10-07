import type {Fn} from './commons.t'

export type CacheBy<C extends Fn> = (...args: Parameters<C>) => string
