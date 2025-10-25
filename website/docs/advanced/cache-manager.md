---
sidebar_position: 1
---

# Cache Manager

When building applications, you often need to manage different sets of caches dynamically. The `CacheManager` helps you organize, share, and clean up cache resources efficiently.

## Why Use CacheManager?

CacheManager solves two key problems:

1. **Dynamic Resource Management**: Free resources when they're no longer needed
2. **Resource Sharing**: Share cache instances between different parts of your application

## Creating a CacheManager

```typescript
import {createCacheManager} from 'celli'

const cacheManager = createCacheManager()
```

## Using CacheManager with Memoization

Use the `via` option to connect your memoized functions to a CacheManager:

```typescript
import {createCacheManager, Cache} from 'celli'

const cacheManager = createCacheManager()

const userContext = {
  cacheManager: cacheManager
}

class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    via: (context) => context.cacheManager,
    async: true,
    ttl: 1000,
    lru: 100
  })
  static getUserSecret(context: typeof userContext, userId: string) {
    return fetch(`https://some.api/user/${userId}/secret`)
  }
}

SomeService.getUserSecret(userContext, '123')
```

## Managing Cache Lifecycle

Clean up all resources managed by a CacheManager:

```typescript
// Later in your application lifecycle
await cacheManager.clear()
```

The `clear()` method will:
- Clean all registered cache instances
- Only clean caches that are not shared with other managers
- Disconnect the manager from all its resources

:::tip
`clear()` marks the end of a CacheManager's lifecycle
:::

## Sharing Resources Between Managers

Create child managers that inherit resources from parent managers:

```typescript
const parentManager = createCacheManager()
parentManager.register(someCache, 'shared-cache')

// Child manager shares resources with parent
const childManager = createCacheManager(parentManager)

// Both have access to 'shared-cache'
const cache1 = parentManager.getByRef('shared-cache')
const cache2 = childManager.getByRef('shared-cache')
console.log(cache1 === cache2) // true

// Clearing child won't affect shared resources
await childManager.clear() // shared-cache remains in parentManager
```

## CacheManager API

### `register(cache, ref?)`

Register a cache or any cleanable object to the manager:

```typescript
const cache = createCache()
cacheManager.register(cache, 'my-cache')
```

The `ref` parameter is optional and can be any type (uses `Map` internally).

### `unregister(cache)`

Remove a cache from the manager:

```typescript
cacheManager.unregister(cache)
```

### `getByRef(ref)`

Retrieve a cache by its reference:

```typescript
const cache = cacheManager.getByRef('my-cache')
```

### `clear()`

Clean all managed resources and disconnect:

```typescript
await cacheManager.clear()
```

### `onClear(fn)`

Subscribe to the clear event:

```typescript
const unsubscribe = cacheManager.onClear(() => {
  console.log('Manager is being cleared')
})

// Later, unsubscribe if needed
unsubscribe()
```

## What Can Be Managed?

CacheManager can manage any object that implements a `clean()` method (called "Cleanable"). This includes:

- Cache instances created with `createCache()`
- Memoized functions created with `cache()`, `Cache` decorator, or `cacheWith()`
- Custom objects with cleanup logic

```typescript
const cleanable = {
  clean: async () => {
    console.log('Cleaning up custom resource')
  }
}

cacheManager.register(cleanable, 'custom')
```

## Global CacheManager

Top-level memoization APIs (`@Cache`, `cache()`, `cacheWith()`) automatically register with a global CacheManager. You can clean them all at once:

```typescript
import {clean} from 'celli'

process.on('SIGTERM', async () => {
  await clean() // Cleans all top-level memoized functions
})
```

## Real-World Example: Request Context

A common pattern is to create a CacheManager per request in server applications:

```typescript
import {createCacheManager} from 'celli'
import {Cache} from 'celli'

// Middleware to create request-scoped cache manager
app.use((req, res, next) => {
  req.cacheManager = createCacheManager()

  res.on('finish', async () => {
    await req.cacheManager.clear()
  })

  next()
})

// Service using request-scoped caching
class DataService {
  @Cache({
    cacheBy: (id) => id,
    via: (req) => req.cacheManager,
    ttl: 60000
  })
  static async getData(req: Request, id: string) {
    return await database.query(id)
  }
}
```

This ensures each request has its own isolated cache that's automatically cleaned up when the request completes.

## Next Steps

- [Composable Caches](./composable-caches.md) - Build custom cache compositions
- [Source Caches](./source-caches.md) - Integrate with external data sources
- [Graceful Shutdown](./graceful-shutdown.md) - Handle application shutdown properly
