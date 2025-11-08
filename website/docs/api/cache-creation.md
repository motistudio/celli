---
sidebar_position: 2
---

# Cache Creation API

APIs for creating cache instances.

## createCache()

Creates a cache instance with configurable options.

### Signature

```typescript
function createCache<K = any, V = any>(options?: CacheOptions<K, V>): AnyCacheType<K, V>
```

### Options

```typescript
interface CacheOptions<K, V> {
  async?: boolean
  ttl?: number
  lru?: number | {
    maxSize: number
    getItemSize?: (value: V) => number
  }
  effects?: Effect<V>[]
  dispose?: (value: V) => void | Promise<void>
  source?: AsyncCache<K, V>
}
```

#### `async`
- **Type**: `boolean`
- **Default**: `false`
- Enables async concurrency and promise caching

#### `ttl`
- **Type**: `number` (milliseconds)
- **Default**: `undefined`
- Time-to-live for cached items

#### `lru`
- **Type**: `number | { maxSize: number, getItemSize?: (value: V) => number }`
- **Default**: `undefined`
- LRU eviction configuration
- If number provided, sets `maxSize` with default item size of 1

#### `effects`
- **Type**: `Effect<V>[]`
- **Default**: `undefined`
- Array of effect functions for lifecycle management

#### `dispose`
- **Type**: `(value: V) => void | Promise<void>`
- **Default**: `undefined`
- Cleanup function called when item is deleted

#### `source`
- **Type**: `AsyncCache<K, V>`
- **Default**: `undefined`
- Remote cache source for backup/loading

### Examples

#### Basic Cache

```typescript
import {createCache} from 'celli'

const cache = createCache()
cache.set('key', 'value')
cache.get('key') // 'value'
```

#### Async Cache with TTL and LRU

```typescript
const cache = createCache({
  async: true,
  ttl: 60000, // 1 minute
  lru: 100
})

await cache.set('key', 'value')
const value = await cache.get('key')
```

#### Cache with Dispose

```typescript
const cache = createCache({
  dispose: (connection) => {
    connection.close()
  }
})

cache.set('db1', dbConnection)
await cache.clean() // Closes all connections
```

#### Cache with Effects

```typescript
const cache = createCache({
  effects: [
    ({onRead, getSelf}) => {
      console.log('Item created:', getSelf())

      onRead(() => {
        console.log('Item accessed')
      })

      return () => {
        console.log('Item deleted')
      }
    }
  ]
})
```

#### Cache with Remote Source

```typescript
const cache = createCache({
  lru: 100,
  source: source({
    get: async (key) => await redis.get(key)
  })
})
```

---

## sync()

Creates a basic synchronous cache.

### Signature

```typescript
function sync<K = any, V = any>(): ICache<K, V>
```

### Example

```typescript
import {sync} from 'celli'

const cache = sync()
cache.set('key', 'value')
const value = cache.get('key')
```

---

## Cache Interface

All caches implement a Map-like interface:

### Methods

#### `set(key, value, effects?)`

Sets a value in the cache.

```typescript
cache.set(key: K, value: V, effects?: Effect<V>[]): void | Promise<void>
```

The `effects` parameter is only available on caches created with `lifeCycle()`.

#### `get(key)`

Gets a value from the cache.

```typescript
cache.get(key: K): V | undefined | Promise<V | undefined>
```

Returns `undefined` if key doesn't exist.

#### `has(key)`

Checks if a key exists in the cache.

```typescript
cache.has(key: K): boolean | Promise<boolean>
```

#### `delete(key)`

Deletes a key from the cache.

```typescript
cache.delete(key: K): boolean | Promise<boolean>
```

Returns `true` if the key existed and was deleted.

#### `clean()`

Cleans up all cached items and resources.

```typescript
cache.clean(): void | Promise<void>
```

Executes:
- Effect cleanup functions
- Dispose handlers
- Clears all data

#### Iteration Methods

```typescript
cache[Symbol.iterator](): Iterator<[K, V]>
cache.entries(): Iterator<[K, V]>
cache.keys(): Iterator<K>
cache.values(): Iterator<V>
```

Note: Async caches do not support iteration.

### Events

All caches support event subscriptions:

#### `on(event, handler)`

Subscribe to cache events.

```typescript
const unsubscribe = cache.on('get', (key: K) => {
  console.log('Get:', key)
})

cache.on('set', (key: K, value: V) => {
  console.log('Set:', key, value)
})

cache.on('delete', (key: K) => {
  console.log('Delete:', key)
})

cache.on('clean', () => {
  console.log('Cache cleaned')
})

// Unsubscribe
unsubscribe()
```

Available events:
- `'get'`: Fired when an item is retrieved
- `'set'`: Fired when an item is stored
- `'delete'`: Fired when an item is deleted
- `'clean'`: Fired when cache is cleaned

---

## Effect Type

Effects provide lifecycle hooks for cached items:

```typescript
type Effect<V> = (hooks: {
  getSelf: () => V
  deleteSelf: () => void
  onRead: (callback: () => void) => void
}) => void | (() => void | Promise<void>)
```

### Hooks

- **`getSelf()`**: Returns the cached value
- **`deleteSelf()`**: Deletes this item from cache
- **`onRead(callback)`**: Registers callback to fire when item is read

### Return Value

Return a cleanup function that will be called when the item is deleted.

### Example

```typescript
const effect: Effect<Connection> = ({getSelf, onRead, deleteSelf}) => {
  const connection = getSelf()

  // Setup
  connection.on('error', () => {
    console.error('Connection error')
    deleteSelf()
  })

  // Track reads
  onRead(() => {
    console.log('Connection accessed')
  })

  // Cleanup
  return () => {
    connection.close()
  }
}
```

---

## See Also

- [Composable Caches](../advanced/composable-caches.md) - Build custom caches
- [Source Caches](../advanced/source-caches.md) - Create source caches
- [API Overview](./overview.md) - Complete API reference
