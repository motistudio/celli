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
import cache from '../memoization/cache'
import Cache from '../decorators/cache'
import once from '../commons/once'
import compose from '../commons/compose'

import cacheManager from './cacheManager'
import wrapUtil from './wrapUtil'
import wrapDecorator from './wrapDecorator'
export * from '../types/cache.t'
import type {Cache as ICache} from '../types/cache.t'

const {clean} = cacheManager

const libCacheWith = wrapUtil(cacheWith, cacheManager)
const libCache = wrapDecorator(Cache, cacheManager)

export {
  // Cache:
  createCache as cache,
  createSource as source,
  lru,
  async,
  lifeCycle,
  effects,
  backup,
  SourceCleanupPolicies,
  // Memoization:
  memo,
  cache as createCache,
  libCacheWith as cacheWith,
  libCache as Cache,
  ICache,
  clean,
  // Commons:
  once,
  compose
}
