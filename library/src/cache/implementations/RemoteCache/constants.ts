import {CACHE_KEY} from '../../constants'

export const FRONT_CACHE = CACHE_KEY
export const REMOTE_CACHE_KEY = Symbol.for('remote-cache-remote-cache')
export const OPTIONS_KEY = Symbol.for('remote-cache-options')

export enum CleanupPolicies {
  ALL = 'all',
  NONE = 'none',
  KEYS = 'only-known-keys'
}

export type SourceOptions = {
  deleteFromSource: boolean,
  cleanupPolicy: CleanupPolicies
}
