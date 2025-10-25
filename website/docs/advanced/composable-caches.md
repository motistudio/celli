---
sidebar_position: 2
---

# Composable Caches

Celli allows you to compose caches together, creating custom caching strategies by combining different behaviors.

## Why Compose Caches?

Different applications have different caching needs. While `createCache()` provides convenient options, you might need more control or custom behaviors. Composable caches let you build exactly what you need.

## Basic Composition

Each cache strategy is a higher-order function that wraps another cache:

```typescript
import {sync, async, lru, ttl} from 'celli'

// Start with a base synchronous cache
const baseCache = sync()

// Add async behavior
const asyncCache = async()(baseCache)

// Add LRU eviction
const lruCache = lru({maxSize: 100})(asyncCache)

// Add TTL expiration
const finalCache = ttl({timeout: 1000})(lruCache)
```

## Using `compose()`

For cleaner syntax, use the `compose()` utility:

```typescript
import {compose, sync, async, lru, ttl, lifeCycle, effects, remote} from 'celli'

const ultimateCache = compose(
  async(),
  lru({maxSize: 100}),
  ttl({timeout: 1000}),
  lifeCycle(),
  effects([/* effect functions */])
)(sync())
```

The `compose()` function applies strategies from top to bottom, where each strategy wraps the previous one.

## Available Strategies

### `sync()`

Creates a basic synchronous cache:

```typescript
import {sync} from 'celli'

const baseCache = sync()

baseCache.set('key', 'value')
const value = baseCache.get('key')
```

### `async()`

Adds async concurrency and promise caching:

```typescript
import {async} from 'celli'

const asyncCache = async()(baseCache)

await asyncCache.set('key', 'value')
const value = await asyncCache.get('key')

// Concurrent calls return the same promise
const p1 = asyncCache.get('key')
const p2 = asyncCache.get('key')
console.log(p1 === p2) // true
```

### `lru(options)`

Adds Least Recently Used eviction:

```typescript
import {lru} from 'celli'

// Simple size limit
const lruCache = lru({maxSize: 100})(baseCache)

// With custom size calculation
const customLruCache = lru({
  maxSize: 1000,
  getItemSize: (item) => JSON.stringify(item).length
})(baseCache)
```

Works seamlessly with async caches:

```typescript
const asyncLruCache = lru({maxSize: 100})(async()(baseCache))

await asyncLruCache.set('key', 'value')
```

### `ttl(options)`

Adds Time To Live expiration:

```typescript
import {ttl} from 'celli'

const ttlCache = ttl({timeout: 5000})(baseCache)

cache.set('key', 'value')
// After 5000ms, the item is automatically removed
```

### `lifeCycle()`

Enables per-item lifecycle management:

```typescript
import {lifeCycle} from 'celli'

const lifecycleCache = lifeCycle()(baseCache)

lifecycleCache.set('key', 'value', [
  ({onRead, getSelf, deleteSelf}) => {
    console.log('Item created')

    onRead(() => {
      console.log('Item accessed')
    })

    return () => {
      console.log('Item deleted')
    }
  }
])

lifecycleCache.get('key') // Logs: Item accessed
lifecycleCache.delete('key') // Logs: Item deleted
```

### `effects(effectsArray)`

Applies constant effects to all items:

```typescript
import {effects} from 'celli'

const effectsCache = effects([
  ({onRead}) => {
    onRead(() => {
      console.log('Item read')
    })

    return () => {
      console.log('Item deleted')
    }
  }
])(baseCache)

// Regular set() - effects are applied automatically
effectsCache.set('key', 'value')
effectsCache.get('key') // Logs: Item read
```

The difference from `lifeCycle()` is that `effects()` applies the same effects to all items, while `lifeCycle()` allows different effects per item.

### `remote(sourceCache, options?)`

Adds a remote backup source:

```typescript
import {remote, source} from 'celli'

const redisSource = source({
  get: async (key) => await redis.get(key),
  set: async (key, value) => await redis.set(key, value)
})

const cacheWithBackup = remote(redisSource, {
  deleteFromSource: false,
  cleanupPolicy: 'KEYS'
})(lru({maxSize: 100})(baseCache))
```

#### Cleanup Policies

- **`ALL`**: Clean the source cache when local cache is cleaned
- **`NONE`**: Never clean the source cache
- **`KEYS`**: Only clean keys that exist in the local cache

## Complete Example

Here's a production-ready cache with multiple strategies:

```typescript
import {compose, sync, async, lru, ttl, effects, remote, source} from 'celli'

// Define remote source (e.g., Redis)
const redisSource = source({
  get: async (key) => {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : undefined
  },
  set: async (key, value) => {
    await redis.set(key, JSON.stringify(value), 'EX', 3600)
  }
})

// Compose the cache
const productionCache = compose(
  async(), // Async concurrency
  lru({
    maxSize: 500,
    getItemSize: (item) => JSON.stringify(item).length
  }), // LRU eviction
  ttl({timeout: 60000}), // 1-minute TTL
  effects([
    ({onRead}) => {
      let hits = 0
      onRead(() => {
        hits++
        console.log(`Cache hits: ${hits}`)
      })
    }
  ]), // Track access
  remote(redisSource, {
    cleanupPolicy: 'KEYS'
  }) // Redis backup
)(sync())

// Use it
await productionCache.set('user:123', {name: 'John', age: 30})
const user = await productionCache.get('user:123')
```

## Custom Strategies

You can create your own cache strategies by following the pattern:

```typescript
import {ICache, AnyCacheType} from 'celli'

function myCustomStrategy<K, V>(options: MyOptions) {
  return (cache: AnyCacheType<K, V>): AnyCacheType<K, V> => {
    return {
      get(key: K) {
        // Custom logic before
        const value = cache.get(key)
        // Custom logic after
        return value
      },
      set(key: K, value: V) {
        // Custom logic
        return cache.set(key, value)
      },
      // Implement other cache methods...
    }
  }
}

// Use it
const customCache = myCustomStrategy(options)(baseCache)
```

## Best Practices

1. **Start with `sync()`**: Always use `sync()` as your base cache
2. **Add `async()` early**: If you need async, apply it early in the composition
3. **LRU + TTL**: Combine both to prevent memory leaks
4. **Effects for monitoring**: Use effects to add observability
5. **Remote for scaling**: Use remote sources for distributed caching

## Next Steps

- [Source Caches](./source-caches.md) - Learn about creating source caches
- [Cache Manager](./cache-manager.md) - Manage multiple cache instances
- [API Reference](../api/overview.md) - Complete API documentation
