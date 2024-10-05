import {CleanupPolicies as SourceCleanupPolicies} from '../cache/implementations/BackupCache/constants'

import createCache from '../cache/createCache'
import createSource from '../cache/createSource'

import lru from '../cache/transformers/lru'
import async from '../cache/transformers/async'
import lifeCycle from '../cache/transformers/lifeCycle'
import effects from '../cache/transformers/effects'
import backup from '../cache/transformers/backup'

export * from '../types/cache.t'

export {
  createCache,
  createSource as source,
  lru,
  async,
  lifeCycle,
  effects,
  backup,
  SourceCleanupPolicies
}
