---
sidebar_position: 2
---

# Basic Usage

Celli makes function memoization simple and powerful. This guide covers the basic usage patterns.

## Function Memoization with Decorator

The `@Cache` decorator is the easiest way to memoize class methods:

```typescript
import {Cache} from 'celli'

class UserService {
  @Cache({
    cacheBy: (userId) => userId,
    async: true,
    ttl: 1000,
    lru: 100
  })
  async getUserSecret(userId: string) {
    return await fetch(`https://some.api/user/${userId}/secret`)
  }
}
```

### Configuration Options

- **`cacheBy`**: Function that determines the cache key from the function arguments
- **`async`**: If true, enforces async concurrency and caches promises
- **`ttl`**: Time to live for each cached item (in milliseconds)
- **`lru`**: Maximum number of items in the cache
- **`dispose`**: Function called when an item is deleted from the cache
- **`effects`**: Array of effects applied to each cached item

## Function Memoization with `cache()`

If you prefer a functional approach, use the `cache` utility:

```typescript
import {cache} from 'celli'

const getUserSecret = cache(
  (userId: string) => fetch(`https://some.api/user/${userId}/secret`),
  {
    cacheBy: (userId) => userId,
    async: true,
    ttl: 1000,
    lru: 100
  }
)

// Use it like a regular function
const secret = await getUserSecret('user-123')
```

## Simple Memoization with `memo()`

For the simplest use case without configuration:

```typescript
import {memo} from 'celli'

const expensiveCalculation = memo((a: number, b: number) => {
  console.log('Computing...')
  return a * b + Math.random()
})

console.log(expensiveCalculation(5, 10)) // Computing... 50.xxx
console.log(expensiveCalculation(5, 10)) // 50.xxx (cached, no log)
```

## Using Custom Cache Instances

You can provide your own cache instance for more control:

```typescript
import {createCache, Cache} from 'celli'

const cache = createCache({
  ttl: 1000,
  lru: {
    maxSize: 100,
    getItemSize: (item) => 1
  }
})

const userContext = {
  cacheRef: cache
}

class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    from: (context) => context.cacheRef
  })
  static getUserSecret(context: typeof userContext, userId: string) {
    return fetch(`https://some.api/user/${userId}/secret`)
  }
}

// The cache instance is extracted from the first parameter
SomeService.getUserSecret(userContext, '123')
```

Using the `from` option allows each function to be memoized separately for each cache reference, giving you flexibility to store caches within your application context.

## Cleaning Up

Celli provides methods to clean up cached data:

```typescript
// Clean a specific memoized function
memoizedFunction.clean()

// Global cleanup (for top-level memoization)
import {clean} from 'celli'

process.on('SIGTERM', async () => {
  await clean()
})
```

## Next Steps

- [Cache Creation](./cache-creation.md) - Learn how to create custom cache instances
- [Advanced Usage](../advanced/cache-manager.md) - Explore advanced cache management
- [API Reference](../api/overview.md) - Dive into the complete API
