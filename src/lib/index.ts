import {CleanupPolicies as SourceCleanupPolicies} from '../cache/implementations/BackupCache/constants'

import createCache from '../cache/createCache'
import createSource from '../cache/createSource'

import lru from '../cache/transformers/lru'
import async from '../cache/transformers/async'
import lifeCycle from '../cache/transformers/lifeCycle'
import effects from '../cache/transformers/effects'
import backup from '../cache/transformers/backup'

import memo from '../memoization/memo'
import cacheWith from '../memoization/cacheWith'
import cache from '../decorators/cache'
import Cache from '../decorators/cache'
import once from '../commons/once'
import compose from '../commons/compose'

import cacheManager from './cacheManager'
import wrapUtil from './wrapUtil'
import wrapTransformer from './wrapTransformer'
import wrapDecorator from './wrapDecorator'
export * from '../types/cache.t'
import type {Cache as ICache} from '../types/cache.t'

const {clean} = cacheManager

const libMemo = wrapUtil(memo, cacheManager)
const libCacheWith = wrapUtil(cacheWith, cacheManager)
const source = wrapUtil(createSource, cacheManager)
const libCreateCache = wrapUtil(createCache, cacheManager)

const libLru = wrapTransformer(lru, cacheManager)
const libAsync = wrapTransformer(async, cacheManager)
const libLifeCycle = wrapTransformer(lifeCycle, cacheManager)
const libEffects = wrapTransformer(effects, cacheManager)
const libBackup = wrapTransformer(backup, cacheManager)
const libCache = wrapDecorator(Cache, cacheManager)

export {
  // Cache:
  libCreateCache as cache,
  source,
  libLru as lru,
  libAsync as async,
  libLifeCycle as lifeCycle,
  libEffects as effects,
  libBackup as backup,
  SourceCleanupPolicies,
  // Memoization:
  libMemo as memo,
  cache as createCache,
  libCacheWith as cacheWith,
  libCache as Cache,
  ICache,
  clean,
  // Commons:
  once,
  compose
}
