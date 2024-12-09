import type {
  Cache as ICache,
  AsyncCache,
  AnyCacheType,
  CacheKey,
  CacheValue,
  LifeCycleCache,
  LruCache
} from '../types/cache.t'
import type {Cleanable} from '../types/cacheManager.t'
import type {Effect, EffectApi} from '../types/effects.t'
import type {MemoizedFn, CacheBy, CacheFrom, CacheManagerFrom} from '../types/memoization.t'
import type {CacheCreationOptions, LruCacheOptions, LruItemSizeGetter} from '../types/functional.t'
import type {Fn} from '../types/commons.t'

import {CleanupPolicies as SourceCleanupPolicies} from '../cache/implementations/RemoteCache/constants'

import createBaseCache from '../cache/createCache'
import createSource from '../cache/createSource'

import lru from '../cache/transformers/lru'
import async from '../cache/transformers/async'
import lifeCycle from '../cache/transformers/lifeCycle'
import effects from '../cache/transformers/effects'
import remote from '../cache/transformers/remote'
import createCache from '../cache/create'

import createCacheManager from '../createCacheManager'

import memo from '../memoization/memo'
import cacheWith from '../memoization/cacheWith'
import cacheVia from '../memoization/cacheVia'
import once from '../commons/once'
import compose from '../commons/compose'

import getCacheDecorator from './getCacheDecorator'
import getUniversalCache from './getUniversalCache'

import cacheManager from './cacheManager'
import wrapUtil from './wrapUtil'

const {clean} = cacheManager

const libCache = getCacheDecorator(cacheManager)
const libUniversalCache = getUniversalCache(cacheManager)
const libCacheWith = wrapUtil(cacheWith, cacheManager)

export {
  // Cache:
  createCache,
  createBaseCache as sync,
  createSource as source,
  lru,
  async,
  lifeCycle,
  effects,
  remote,
  SourceCleanupPolicies,
  // CacheManager:
  createCacheManager,
  // Memoization:
  memo,
  libUniversalCache as cache,
  cacheVia,
  libCacheWith as cacheWith,
  libCache as Cache,
  clean,
  // Commons:
  once,
  compose,
  // Cache types:
  type ICache,
  type AsyncCache,
  type AnyCacheType,
  type CacheKey,
  type CacheValue,
  type LifeCycleCache,
  type LruCache,
  type Cleanable,
  // Effect types:
  type Effect,
  type EffectApi,
  // Memoization types:
  type MemoizedFn,
  type CacheBy,
  type CacheFrom,
  type CacheManagerFrom,
  // Functional types:
  type CacheCreationOptions,
  type LruCacheOptions,
  type LruItemSizeGetter,
  // Commons types:
  type Fn
}
