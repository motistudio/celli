---
sidebar_position: 1
---

# API Overview

This section provides comprehensive documentation for all Celli APIs.

## Core APIs

### Cache Creation

- [createCache()](./cache-creation.md#createcache) - Create a cache instance with options
- [sync()](./cache-creation.md#sync) - Create a basic synchronous cache
- See [Source Caches](../advanced/source-caches.md) for creating external data sources

### Memoization

- `cache()` - Memoize a function with options
- `@Cache` - Decorator for memoizing methods
- `memo()` - Simple memoization without configuration
- `once()` - Ensure a function runs only once

### Cache Management

- See [Cache Manager](../advanced/cache-manager.md) for managing multiple cache instances
- `clean()` - Global cleanup function

## Composable Strategies

Build custom caches by composing strategies (see [Composable Caches](../advanced/composable-caches.md)):

- `async()` - Add async concurrency
- `lru()` - Add LRU eviction
- `ttl()` - Add TTL expiration
- `lifeCycle()` - Add per-item lifecycle
- `effects()` - Add constant effects
- `remote()` - Add remote backup
- `compose()` - Compose multiple strategies

## Types and Interfaces

- `ICache` - Basic cache interface
- `AsyncCache` - Async cache interface
- `AnyCacheType` - Union of all cache types
- `CacheKey<C>` - Extract key type from cache
- `CacheValue<C>` - Extract value type from cache
- `Cleanable` - Object with cleanup method

## Constants

- `SourceCleanupPolicies` - Cleanup policy enum

## Quick Reference

### Import Paths

```typescript
// Main exports
import {
  // Cache creation
  createCache,
  sync,
  source,

  // Memoization
  cache,
  Cache,
  memo,
  once,

  // Management
  createCacheManager,
  clean,

  // Composable strategies
  async,
  lru,
  ttl,
  lifeCycle,
  effects,
  remote,
  compose,

  // Types
  ICache,
  AsyncCache,
  AnyCacheType,
  CacheKey,
  CacheValue,

  // Constants
  SourceCleanupPolicies
} from 'celli'
```

### Common Patterns

#### Simple Memoization

```typescript
import {cache} from 'celli'

const fn = cache((id: string) => expensiveOperation(id), {
  cacheBy: (id) => id,
  ttl: 5000,
  lru: 100
})
```

#### Class Method Decorator

```typescript
import {Cache} from 'celli'

class Service {
  @Cache({
    cacheBy: (id) => id,
    async: true,
    ttl: 5000
  })
  async getData(id: string) {
    return await fetch(`/api/${id}`)
  }
}
```

#### Custom Cache

```typescript
import {compose, sync, async, lru, ttl} from 'celli'

const cache = compose(
  async(),
  lru({maxSize: 100}),
  ttl({timeout: 5000})
)(sync())
```

#### With Remote Source

```typescript
import {createCache, source} from 'celli'

const cache = createCache({
  lru: 100,
  source: source({
    get: async (key) => await redis.get(key)
  })
})
```

## Next Steps

Browse the detailed documentation:

- [Cache Creation API](./cache-creation.md)
- [Cache Manager](../advanced/cache-manager.md)
- [Composable Caches](../advanced/composable-caches.md)
- [Source Caches](../advanced/source-caches.md)
