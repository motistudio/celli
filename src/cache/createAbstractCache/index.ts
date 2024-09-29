import type {Key, Cache as ICache, AsyncCache as IAsyncCache, AbstractCache as IAbstractCache} from '../../types/cache.t'

import Cache from '../implementations/Cache'

type BaseContext<K extends Key, T> = {
  cache: Cache<K, T>
}

type Options<K extends Key, T, Context> = {
  createContext: () => Context
  get?: (context: Context, ...args: Parameters<Cache<K, T>['get']>) => ReturnType<IAbstractCache<K, T>['get']>
  set?: (context: Context, ...args: Parameters<Cache<K, T>['set']>) => ReturnType<IAbstractCache<K, T>['set']>
  has?: (context: Context, ...args: Parameters<Cache<K, T>['has']>) => ReturnType<IAbstractCache<K, T>['has']>
  delete?: (context: Context, ...args: Parameters<Cache<K, T>['delete']>) => ReturnType<IAbstractCache<K, T>['delete']>
  keys?: (context: Context, ...args: Parameters<Cache<K, T>['keys']>) => ReturnType<IAbstractCache<K, T>['keys']>
  values?: (context: Context, ...args: Parameters<Cache<K, T>['values']>) => ReturnType<IAbstractCache<K, T>['values']>
  entries?: (context: Context, ...args: Parameters<Cache<K, T>['entries']>) => ReturnType<IAbstractCache<K, T>['entries']>
}

const createContext = <K extends Key, T>(): BaseContext<K, T> => ({cache: new Cache<K, T>})

const get = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['get']>) => {
  return context.cache.get(...args)
}

const set = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['set']>) => {
  return context.cache.set(...args)
}

const has = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['has']>) => {
  return context.cache.has(...args)
}

const remove = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['delete']>) => {
  return context.cache.delete(...args)
}

const keys = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['keys']>) => {
  return context.cache.keys(...args)
}

const values = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['values']>) => {
  return context.cache.values(...args)
}

const entries = <K extends Key, T, Context extends BaseContext<K, T>>(context: Context, ...args: Parameters<Cache<K, T>['entries']>) => {
  return context.cache.entries(...args)
}

// class AbstractCache<K extends Key, T> implements IAbstractCache<K, T> {
//   constructor (get: IAbstractCache<K, T>['get']) {

//   }


// }

// TODO: Fix the override in the signature (implementation of createContext)
// function createAbstractCache <K extends Key, T, Context>(options?: Options<K, T, Context>): AbstractCache<K, T>
function createAbstractCache <K extends Key, T, Context>(options: Options<K, T, Context>): IAbstractCache<K, T> {
  const baseCache = new Cache<K, T>()

  
}

export default createAbstractCache
