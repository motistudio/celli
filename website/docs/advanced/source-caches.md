---
sidebar_position: 3
---

# Source Caches

Source caches allow you to integrate external data sources (like Redis, databases, or APIs) with Celli's caching system.

## What is a Source Cache?

A source cache acts as a bridge between your local cache and an external data source. It enables two patterns:

1. **Proxy Mode**: Forward all operations to the external source (no local storage)
2. **Introduction Mode**: Load data from external source when requested (with local storage)

## Creating a Source Cache

Use the `source()` utility to create a source cache:

```typescript
import {source} from 'celli'

const apiSource = source({
  get: async (key) => {
    return await fetch(`https://api.example.com/data/${key}`)
      .then(res => res.json())
  }
})
```

## Proxy Mode

When you provide both `get` and `set` methods, the source cache acts as a proxy:

```typescript
const redisProxy = source({
  get: async (key) => {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : undefined
  },
  set: async (key, value) => {
    await redis.set(key, JSON.stringify(value))
  },
  has: async (key) => {
    return await redis.exists(key) === 1
  }
})

// Data is stored only in Redis, not locally
await redisProxy.set('key', {data: 'value'})
const value = await redisProxy.get('key')
```

## Introduction Mode

When you only provide a `get` method, the source cache stores data locally and uses `get` to load missing items:

```typescript
const apiCache = source({
  get: async (key) => {
    // This is called only when key is not in local cache
    return await fetch(`https://api.example.com/data/${key}`)
      .then(res => res.json())
  }
})

// First call: loads from API and stores locally
const data1 = await apiCache.get('user-123')

// Second call: returns from local cache (no API call)
const data2 = await apiCache.get('user-123')

// You can also explicitly set values
await apiCache.set('user-456', {name: 'Jane'})
```

## Using with Remote Strategy

Source caches are commonly used with the `remote()` strategy to create tiered caching:

```typescript
import {createCache, source} from 'celli'

// Define the remote source
const redisSource = source({
  get: async (key) => {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : undefined
  },
  set: async (key, value) => {
    await redis.set(key, JSON.stringify(value), 'EX', 3600)
  }
})

// Create local cache with Redis backup
const cache = createCache({
  lru: 100,
  source: redisSource
})

// When item is not in local cache, it checks Redis
const value = await cache.get('key')

// When LRU evicts from local cache, data remains in Redis
```

## Source Options

### Required: `get`

The `get` method is always required:

```typescript
source({
  get: async (key: string) => {
    // Return the value for this key
    // Return undefined if key doesn't exist
    return await externalStore.fetch(key)
  }
})
```

### Optional: `set`

Provide `set` to enable proxy mode:

```typescript
source({
  get: async (key) => { /* ... */ },
  set: async (key, value) => {
    await externalStore.save(key, value)
  }
})
```

### Optional: `has`

Optimize existence checks:

```typescript
source({
  get: async (key) => { /* ... */ },
  has: async (key) => {
    // Return true if key exists
    return await externalStore.exists(key)
  }
})
```

Without `has`, Celli will use `get` to check existence.

## Real-World Examples

### Redis Cache

```typescript
import {source} from 'celli'
import Redis from 'ioredis'

const redis = new Redis()

const redisSource = source({
  get: async (key: string) => {
    const value = await redis.get(key)
    if (!value) return undefined
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  },
  set: async (key: string, value: any) => {
    await redis.set(
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
      'EX',
      3600 // 1 hour expiration
    )
  },
  has: async (key: string) => {
    return await redis.exists(key) === 1
  }
})
```

### Database Cache

```typescript
const dbSource = source({
  get: async (id: string) => {
    const [row] = await db.query(
      'SELECT data FROM cache WHERE id = ?',
      [id]
    )
    return row?.data
  },
  set: async (id: string, data: any) => {
    await db.query(
      'INSERT INTO cache (id, data, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE data = ?, updated_at = NOW()',
      [id, JSON.stringify(data), JSON.stringify(data)]
    )
  }
})
```

### HTTP API Cache

```typescript
const apiSource = source({
  get: async (userId: string) => {
    try {
      const response = await fetch(
        `https://api.example.com/users/${userId}`,
        {
          headers: {'Authorization': `Bearer ${token}`}
        }
      )
      if (!response.ok) return undefined
      return await response.json()
    } catch (error) {
      console.error('API fetch failed:', error)
      return undefined
    }
  }
})
```

## Cleanup Policies

When using `remote()` with a source cache, you can configure cleanup behavior:

```typescript
import {remote, SourceCleanupPolicies} from 'celli'

const cache = remote(redisSource, {
  deleteFromSource: false, // Don't delete from Redis when deleted locally
  cleanupPolicy: SourceCleanupPolicies.KEYS // Only clean keys present locally
})(localCache)
```

### Policy Options

- **`ALL`**: When local cache is cleaned, clean entire source cache
- **`NONE`**: Never clean the source cache (default for shared sources)
- **`KEYS`**: Only clean keys that exist in the local cache

## Best Practices

1. **Error Handling**: Always handle errors in `get`/`set` methods
2. **Serialization**: Handle serialization/deserialization in the source
3. **TTL**: Set appropriate TTL in the remote source
4. **Connection Management**: Reuse connection pools, don't create new connections per operation
5. **Fallback**: Consider what happens if the source is unavailable

```typescript
const robustSource = source({
  get: async (key) => {
    try {
      return await redis.get(key)
    } catch (error) {
      console.error('Redis error:', error)
      return undefined // Fail gracefully
    }
  }
})
```

## Next Steps

- [Cache Manager](./cache-manager.md) - Manage multiple cache instances
- [Graceful Shutdown](./graceful-shutdown.md) - Handle cleanup properly
- [API Reference](../api/overview.md) - Complete API documentation
