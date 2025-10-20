/**
 * Type tests for cache options
 * These tests verify type constraints at compile time using @ts-expect-error
 */

import {cache, createCache, Cache} from '../../src'
import type {ICache, AsyncCache, CacheManager} from '../../src'

// Mock types for testing
declare const myCache: ICache<string, string>
declare const myAsyncCache: AsyncCache<string, string>
declare const myCacheManager: CacheManager

// =============================================================================
// cache() function - from/via mutual exclusion
// =============================================================================

// ✓ Should work: via option
cache(() => 'result', {
  via: () => myCacheManager
})

// ✓ Should work: from option
cache(() => 'result', {
  from: () => myCache
})

// ✓ Should work: neither from nor via
cache(() => 'result', {
  ttl: 1000,
  lru: 100
})

// ✗ Should fail: via and from are mutually exclusive
cache(() => 'result', {
  // @ts-expect-error - via and from are mutually exclusive
  via: () => myCacheManager,
  from: () => myCache
})

// =============================================================================
// createCache() - async/source overloads
// =============================================================================

// ✓ Should work: sync cache (no async, no source)
createCache<string, string>()

// ✓ Should work: async cache with async: true
createCache<string, string>({
  async: true
})

// ✓ Should work: async cache with source
createCache<string, string>({
  source: myAsyncCache
})

// ✗ Should fail: sync cache with async: true
createCache<string, string>({
  async: true
  // @ts-expect-error - async: true returns AsyncCache, not ICache
}) satisfies ICache<string, string>

// ✗ Should fail: async cache without async or source
// @ts-expect-error - returns ICache (sync), not AsyncCache
createCache<string, string>() satisfies AsyncCache<string, string>

// =============================================================================
// Cache decorator - from/via mutual exclusion
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TestService {
  // ✓ Should work: via option
  @Cache({
    via: () => myCacheManager
  })
  methodWithVia() {
    return 'result'
  }

  // ✓ Should work: from option
  @Cache({
    from: () => myCache
  })
  methodWithFrom() {
    return 'result'
  }

  // ✓ Should work: neither from nor via
  @Cache({
    ttl: 1000,
    lru: 100
  })
  methodWithOptions() {
    return 'result'
  }

  // ✗ Should fail: via and from are mutually exclusive
  @Cache({
    // @ts-expect-error - via and from are mutually exclusive
    via: () => myCacheManager,
    from: () => myCache
  })
  methodWithBoth() {
    return 'result'
  }
}
