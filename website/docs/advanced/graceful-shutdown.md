---
sidebar_position: 4
---

# Graceful Shutdown

Proper cleanup is essential for production applications. Celli provides built-in support for graceful shutdowns and resource management.

## Why Graceful Shutdown Matters

When your application shuts down, you need to:
- Release database connections
- Close file handles
- Flush pending writes
- Clean up event listeners
- Disconnect from external services

Celli's cleanup system ensures all cached resources are properly disposed of.

## The `clean()` Method

Every cache and memoized function has a `clean()` method:

```typescript
import {createCache} from 'celli'

const cache = createCache({
  dispose: (connection) => {
    connection.close()
  }
})

// Later, during shutdown
await cache.clean()
```

The `clean()` method:
- Waits for all cleanup operations to complete
- Calls `dispose` for each cached item
- Executes cleanup functions from lifecycle effects
- Clears all cached data

## Global Cleanup

For top-level memoization (using `@Cache`, `cache()`, or `cacheWith()`), use the global `clean()` function:

```typescript
import {clean} from 'celli'

// In your shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up...')
  await clean()
  console.log('Cleanup complete')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, cleaning up...')
  await clean()
  console.log('Cleanup complete')
  process.exit(0)
})
```

This will clean all caches created through the top-level memoization API.

## Cleanup with Dispose

Use `dispose` to run cleanup logic when items are removed:

```typescript
import {createCache} from 'celli'
import {createConnection} from './db'

const connectionCache = createCache({
  dispose: async (connection) => {
    console.log('Closing database connection')
    await connection.close()
  }
})

// Store connections
connectionCache.set('db1', await createConnection('db1'))
connectionCache.set('db2', await createConnection('db2'))

// During shutdown, all connections are closed
await connectionCache.clean()
```

## Cleanup with Effects

Use effects for more complex cleanup scenarios:

```typescript
const cache = createCache({
  effects: [
    ({getSelf, onRead}) => {
      const item = getSelf()

      // Subscribe to events
      const handler = () => console.log('Event received')
      item.on('data', handler)

      // Cleanup function
      return () => {
        console.log('Unsubscribing from events')
        item.off('data', handler)
        item.disconnect()
      }
    }
  ]
})

// Cleanup executes all effect cleanup functions
await cache.clean()
```

## CacheManager Cleanup

When using `CacheManager`, clean all managed resources at once:

```typescript
import {createCacheManager} from 'celli'

const cacheManager = createCacheManager()

// ... register caches ...

// During shutdown
await cacheManager.clear()
```

This is particularly useful for request-scoped or session-scoped caches.

## Express.js Example

```typescript
import express from 'express'
import {createCacheManager, Cache, clean} from 'celli'

const app = express()

// Per-request cache manager
app.use((req, res, next) => {
  req.cacheManager = createCacheManager()

  res.on('finish', async () => {
    await req.cacheManager.clear()
  })

  next()
})

// Service with request-scoped caching
class UserService {
  @Cache({
    cacheBy: (id) => id,
    via: (req) => req.cacheManager
  })
  static async getUser(req: Request, id: string) {
    return await database.users.findById(id)
  }
}

// Global shutdown handler
const server = app.listen(3000)

process.on('SIGTERM', async () => {
  console.log('SIGTERM received')

  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed')
  })

  // Clean up global caches
  await clean()

  process.exit(0)
})
```

## NestJS Example

```typescript
import { Injectable, OnModuleDestroy } from '@nestjs/common'
import {createCacheManager, Cache} from 'celli'

@Injectable()
export class CacheService implements OnModuleDestroy {
  private cacheManager = createCacheManager()

  async onModuleDestroy() {
    await this.cacheManager.clear()
  }

  @Cache({
    via: (service) => service.cacheManager,
    ttl: 60000,
    lru: 100
  })
  async getData(id: string) {
    return await this.database.query(id)
  }
}
```

## Cleanup Order

Cleanup happens in this order:

1. **Stop accepting new cache operations**
2. **Execute lifecycle cleanup functions** (from effects)
3. **Call dispose handlers** for each cached item
4. **Clear all cache data**
5. **Disconnect from resources**

## Timeout Considerations

Long-running cleanup operations can delay shutdown. Consider adding timeouts:

```typescript
const CLEANUP_TIMEOUT = 5000 // 5 seconds

process.on('SIGTERM', async () => {
  const timeoutHandle = setTimeout(() => {
    console.error('Cleanup timeout exceeded, forcing exit')
    process.exit(1)
  }, CLEANUP_TIMEOUT)

  try {
    await clean()
    clearTimeout(timeoutHandle)
    process.exit(0)
  } catch (error) {
    console.error('Cleanup error:', error)
    process.exit(1)
  }
})
```

## Best Practices

1. **Always register shutdown handlers**: Listen for SIGTERM and SIGINT
2. **Clean in reverse order**: Clean application-level resources before global ones
3. **Handle errors**: Cleanup should not throw unhandled errors
4. **Set timeouts**: Prevent indefinite hangs during shutdown
5. **Test shutdown**: Regularly test your shutdown procedures
6. **Log cleanup**: Add logging to verify cleanup is working

## Testing Cleanup

```typescript
import {describe, it, expect} from 'vitest'
import {createCache} from 'celli'

describe('Cache cleanup', () => {
  it('should call dispose on cleanup', async () => {
    let disposed = false

    const cache = createCache({
      dispose: () => {
        disposed = true
      }
    })

    cache.set('key', 'value')
    await cache.clean()

    expect(disposed).toBe(true)
  })

  it('should execute effect cleanup', async () => {
    let cleaned = false

    const cache = createCache({
      effects: [
        () => {
          return () => {
            cleaned = true
          }
        }
      ]
    })

    cache.set('key', 'value')
    await cache.clean()

    expect(cleaned).toBe(true)
  })
})
```

## Next Steps

- [Cache Manager](./cache-manager.md) - Learn about resource management
- [Composable Caches](./composable-caches.md) - Build custom cache compositions
