---
sidebar_position: 3
---

# Cache Creation

Celli provides flexible ways to create and configure cache instances to suit your specific needs.

## Basic Cache Creation

The simplest way to create a cache is using `createCache`:

```typescript
import {createCache} from 'celli'

// Simple synchronous cache
const cache = createCache()

cache.set('key', 'my-data')
cache.get('key') // 'my-data'
```

## Async Cache

Create an async cache that enforces async concurrency and caches promises:

```typescript
const asyncCache = createCache({async: true})

await asyncCache.set('key', 'my-data')
await asyncCache.get('key') // 'my-data'

// Concurrent calls return the same promise
const promise1 = asyncCache.get('key')
const promise2 = asyncCache.get('key')
console.log(promise1 === promise2) // true
```

## LRU Cache

Create a cache with Least Recently Used (LRU) eviction policy:

```typescript
const lruCache = createCache({lru: 100})

// With custom size calculation
const lruCacheWithSize = createCache({
  lru: {
    maxSize: 1000,
    getItemSize: (item) => JSON.stringify(item).length
  }
})
```

## TTL Cache

Create a cache with Time To Live (TTL) expiration:

```typescript
// Items expire after 1000ms
const ttlCache = createCache({ttl: 1000})
```

## Cache with Lifecycle Effects

Apply custom lifecycle effects to cache items:

```typescript
const lifecycleCache = createCache({
  effects: [
    ({getSelf, deleteSelf, onRead}) => {
      // This code runs when the item is set
      console.log('Item created')

      onRead(() => {
        console.log('Item accessed')
      })

      return () => {
        // This code runs when the item is deleted
        console.log('Item destroyed')
      }
    }
  ]
})
```

## Cache with Dispose Handler

Execute cleanup logic when items are removed:

```typescript
const cacheWithDispose = createCache({
  dispose: (client) => {
    // Cleanup code when item is deleted
    client.disconnect()
  }
})
```

## Cache with Remote Source

Use an external data source (like Redis) as a backup:

```typescript
import {createCache, source} from 'celli'

const redisSource = source({
  get: async (key) => {
    return await redis.get(key)
  },
  set: async (key, value) => {
    await redis.set(key, value)
  }
})

const cacheWithRemote = createCache({
  lru: 100,
  source: redisSource
})
```

## Combining Options

You can combine multiple options to create sophisticated caching strategies:

```typescript
const advancedCache = createCache({
  async: true,
  ttl: 5000,
  lru: {
    maxSize: 200,
    getItemSize: (item) => 1
  },
  dispose: (item) => {
    console.log('Disposing:', item)
  },
  effects: [
    ({onRead}) => {
      let readCount = 0
      onRead(() => {
        readCount++
        console.log(`Item read ${readCount} times`)
      })
    }
  ]
})
```

## Cache API

All cache instances implement a Map-like interface:

```typescript
// Set a value
cache.set('key', 'value')

// Get a value
const value = cache.get('key')

// Check if key exists
if (cache.has('key')) {
  // ...
}

// Delete a key
cache.delete('key')

// Iterate over entries
for (const [key, value] of cache) {
  console.log(key, value)
}

// Clean up and free resources
await cache.clean()
```

## Next Steps

- [Composable Caches](../advanced/composable-caches.md) - Build custom cache compositions
- [Cache Manager](../advanced/cache-manager.md) - Manage multiple cache instances
- [API Reference](../api/cache-creation.md) - Complete cache creation API
