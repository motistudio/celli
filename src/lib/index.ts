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
// import Cache from '../decorators/cache'

export * from '../types/cache.t'

import cacheManager from './cacheManager'
import wrapUtil from './wrapUtil'
import wrapTransformer from './wrapTransformer'

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

export {
  // Cache:
  libCreateCache as createCache,
  source,
  libLru as lru,
  libAsync as async,
  libLifeCycle as lifeCycle,
  libEffects as effects,
  libBackup as backup,
  SourceCleanupPolicies,
  // Memoization:
  libMemo as memo,
  libCacheWith as cacheWith,
  // Cache,
  clean
}
