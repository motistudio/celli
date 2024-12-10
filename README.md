# Celli
#### Helping out with memory-management
> Derived from the Latin word "cella", meaning "storage"

Celli is a versatile library designed for caching and memoization in various runtime environments. It provides two primary functionalities:

1. **Cache creation and management**:
   - Offers flexible ways to create and manage caches
   - Provides utils to create a custom cache in a composable manner

2. **Memoization tools & decorators**:
   - Offers utilities for function memoization, taking advantage of the flexible cache creation API
   - Built-in cache invalidations configurations for maintaining low memory consumption, taking the application's lifecycle into account

The library is designed to be flexible and extensible, allowing developers to choose the most appropriate caching strategy based on their specific needs.
It comes without any dependencies (minified file weights only 19kb!), perfectly typed and has 100% test coverage. Hoping to ensure high reliability with no unexpected edge cases.

## Installation

```bash
npm install celli --save
```

## Basic Usage

### Function memoization with advanced caching features
The main goal of the library is caching functions without effort.
We offer utilities that wrap up most of the API in order to provide easy and quick memoization.

```typescript
import {Cache} from 'celli'

class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    async: true
    ttl: 1000,
    lru: 100
  })
  async getUserSecret(userId: string) {
    return await fetch(`https://some.api/user/${userId}/secret`)
  }
}
```

Or

```typescript
import {cache} from 'celli'

const getUserSecret = cache((userId: string) => fetch(`https://some.api/user/${userId}/secret`), {
  cacheBy: (userId) => userId,
  async: true
  ttl: 1000,
  lru: 100
})
```

This code will create a cache behind the scenes and will memoize getUserSecret method.
We can specify parameters as the following:
- `cacheBy` - function that will be used to determine the cache key
- `async` - if true, the cache will necessarily be asynchronous and will enforce async concurrency and cache promises
- `ttl` - time to live for each item
- `lru` - maximum number of items in the cache, it supports `getItemSize` to allow dynamic allocations.
- `dispose` - function that will be called for a deleted item
- `effects` - array of effects that will be applied to each item

But wait! A runtime application needs to manage its resources dynamically.
What if we have different caches or we want to use a cache of our own?

Let's examine such a case with an alternative API:
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

// No need to specify the cache, we will specify where to get it from
class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    from: (context) => context.cacheRef
  })
  static getUserSecret(context: typeof userContext, userId: string) {
    return fetch(`https://some.api/user/${userId}/secret`)
  }
}
```

Using this `from` option will specify where our cache is coming from. Then, each function we'd cache this way will be memoized separately for each cache reference! Allowing us the flexibility to store caches within the application.

### Cache creation
Creating a cache instance is quite simple, and easily done by the `createCache` utility.

```typescript
import {createCache} from 'celli'

// This is a simple synchronous cache:
const cache = createCache()

// This will produce an async cache:
const asyncCache = createCache({async: true})

// This will produce an LRU cache with 100 items:
const lruCache = createCache({lru: 100})

// This will produce a TTL cache with 1000ms ttl
const ttlCache = createCache({ttl: 1000})

// This will produce a cache that enforces a lifecycle for items:
const lifecycleCache = createCache({
  effects: [
    ({getSelf, deleteSelf, onRead}) => {
      // This code will run once when the item is set
      return () => {
        // This code will run once when the item is deleted
      }
    }
  ]
})

// This will produce a cache that will call dispose function when the item is deleted
const cacheWithDispose = createCache({
  dispose: (client) => {
    // This code will run once when the item is deleted
    client.disconnect()
  }
})

// This will create a cache that leans on another cache for data.
// It's useful if we want to use services like redis to hold a bigger cache than our own, while we consume a portion of it for the application.
const cacheWithRemote = createCache({
  lru: 100,
  source: anotherCacheFromAnotherService
})
```

And of course, we can combine all of these options together.

## Advanced Usage

### Cache behavior & cleanup
Each cache implements a similar API to Map.
We have some simple methods such as `set`, `get`, `delete` and `has`.
The cache is also iterable, if we need to iterate over its values, keys or entries.

In addition, we get a special `clean()` method.
This method will not only clear the cache from all its values, but it will also wait for every cleanup operation if there are any.
This is important for freeing resources and for **graceful shutdowns**.

For making things simpler, we also expose a global `clean()` method for all the top-level memoization.
It will clean every memoized function created with `@Cache` decorator, designed to cache shutdowns:

```typescript
import {clean} from 'celli'

process.on('SIGTERM', () => {
  clean()
})
```

It uses a global instance of `CacheManager`, which the top-level memoization API will subscribe to.
It includes `Cache` decorator, `cache` utility and `cacheWith` utility.
Every other util will not be automatically registered, in order to allow the application to set its own cleanup behavior.
This is a last-resort tool to ensure a graceful shutdown.


### Working with `CacheManager`
When an application runs, we may want to manage different sets of caches.
In this case, there are two issues we need to solve:
1. We want to dynamically free resources when they're not needed anymore.
2. We want to share those resources between sessions.

For this case, we can use `createCacheManager` to create structure that will manage cache-like resources.
A CacheManager offer a `clear()` method, which attempts to free every non-shared resources, while disconnecting from the resources it manages.

In order to use it dynamically, we can use the `via` option in the `Cache` decorator.
This option will receive the CacheManager instance and will allow us to specify which cache we want to use for the function.

```typescript
import {createCacheManager} from 'celli'

const cacheManager = createCacheManager()

const userContext = {
  // ...content stuff
  cacheManager: cacheManager
}

class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    via: (context) => context.cm,
    async: true
    ttl: 1000,
    lru: 100
  })
  static getUserSecret(context: typeof userContext, userId: string) {
    return fetch(`https://some.api/user/${userId}/secret`)
  }
}

SomeService.getUserSecret(userContext, '123')
```

Later in the lifecycle, we can invoke `cacheManager.clear()` to free all the resources it holds:
```typescript
cacheManager.clear()
```

If no other cacheManager has access to this cache, it will be cleaned.

> It's important to note that when we don't use `via`, the caches are still being registered to the global cacheManager, which we can always clean with `clean()`.
> This applied to the `Cache` decorator, `cache` utility and `cacheWith` utility.
> We can also take advantage of this mechanism to use it on every object that implements a `clean()` method.

For manual work with `CacheManager`, it has the following API:
- `register(cache, ref?)` - Register a cache to the manager, and an optional reference to the cache instance. This ref could help us get this specific cache later on.
- `unregister(cache)` - Unregister a cache from the manager
- `getByRef(ref)` - Get a cache by the reference it was registered with. It uses `Map` so it doesn't have to be necessarily a string.
- `clear()` - Clears the resources (cache instances) registered, and also **cleans the ones it doesn't share**. This is a very important mechanism, done to correctly clear redundant resources.
- `onClear(fn)` - Subscribe to the clear event

`CacheManager` will not manage only cache instances, but every object that implements a `clean()` method ("`Cleanable`").
That includes memoized functions as well.

**`Clear` marks the end of a given cacheManager's lifecycle**

When creating a `CacheManager`, we can also provide another given instance in order to share its resources.
This is useful if we want to share different `CacheManager` instances, maybe with different contexts.
```typescript
import {createCacheManager} from 'celli'

const cacheManager = createCacheManager()
cacheManager.register(...)

const cacheManager2 = createCacheManager(cacheManager)
// cacheManager2 has access to the same caches as cacheManager
```

### Custom cache composition
Every application has different needs.
While it's good practice to configure each cache with LRU and TTL to avoid memory leaks, your application may require its own custom behavior.

For this purpose, we provide a set of utilities to compose caches together.
```typescript
import {sync, lru, async, lifeCycle, effects, remote, compose} from 'celli'

const baseCache = sync() // This is a simple synchronous cache
const asyncCache = async()(baseCache) // This will produce an async cache, on top of our base cache
const lruCache = lru({maxSize: 100})(asyncCache) // This will produce an LRU cache with 100 items
const ttlCache = ttl({timeout: 1000})(lruCache) // This will produce a TTL cache with 1000ms ttl
const lifecycleCache = lifeCycle()(ttlCache) // This will produce a cache with lifecycle
const effectsCache = effects([...effects])(lifecycleCache) // This will produce a cache with effects
const remoteCache = remote(anotherCacheFromAnotherService)(effectsCache) // This will produce a cache with remote-backup
```
As you can see, each cache can use another cache to enforce its logic and strategy.
Each strategy is exposed as a high-order function that can wrap around our base cache.

When putting everything together, we get:

```typescript
import {compose, lru, ttl, lifeCycle, async, effects, remote} from 'celli'

const ultimateCache = compose(
  lru(100),
  ttl(1000),
  lifeCycle(),
  async(),
  effects([...effects]),
  remote(anotherCacheFromAnotherService)
)(baseCache)
```

## Integration Features

### Events
Cache instances emit events that you can subscribe to:

```typescript
cache.on('get', (key) => {
  console.log('set', key)
})
cache.on('set', (key, value) => {
  console.log('set', key, value)
})
cache.on('delete', (key) => {
  console.log('delete', key)
})
cache.on('clean', () => {
  console.log('clean')
})
```

Each function will return a callback to unsubscribe from the event:
```typescript
const unsubscribe = cache.on('get', (key) => {
  console.log('set', key)
})

unsubscribe()
```

### Designing a source-cache
As mentioned, we may want to utilize larger caches in other services, such as Redis.
We can achieve this behavior using the `remote` and `source` features.

Since Redis itself is not a cache implementation, we need to design an interface for it.
This is where the `source` cache comes in:

```typescript
import {source} from 'celli'

const sourceCache = source({
  get: async (key) => {
    return await fetch(`https://some.api/data/${key}`)
  },
  set: async (key, value) => {
    return await fetch(`https://some.api/data/${key}`, {
      method: 'POST',
      body: value
    })
  }
})
```

This utility helps create an `AsyncCache` that works as a proxy. You can then use this cache as a source for another cache.

Creating a source could happen in two ways. We could either provide a `set` method or not.
Providing a `set` method will make this cache a proxy. It will not save any data by itself, but it will forward the data to the source cache.
If we don't provide a `set` method, having only `get` applied, this cache will act as an `AsyncCache` that will save the data and will use `get` to "introduce" new items if they are requested.

## API Reference

### Cache Creation and Management

#### `sync()`
Creates a basic sync instance.
```typescript
const baseCache = sync()

sync.set('key', 'my-data')
sync.get('key') // 'my-data'
```

#### `source()`
Creates a source cache instance, for external loading of data.
```typescript
const sourceCache = source({
  get: async (key) => {
    return await fetch(`https://some.api/data/${key}`)
  }
})

const externalSourceCache = source({
  get: async (key) => {
    return await fetch(`https://some.api/data/${key}`)
  },
  set: async (key, value) => {
    return await fetch(`https://some.api/data/${key}`, {
      method: 'POST',
      body: value
    })
  },
  has: async (key) => {
    return !!(await fetch(`https://some.api/data/${key}`))
  }
})
```

#### `clean()`
A global cleanup method for all the top-level memoization.
```typescript
process.on('SIGTERM', async () => {
  await clean()
})
```

### Cache Extensions

#### `lru(options)`
Applies Least Recently Used (LRU) caching strategy.
```typescript
const baseCache = cache()
const lruCache = lru({
  maxSize: 100,
  getItemSize: (item) => 1 // Optional, for dynamic allocation
})(baseCache)

lruCache.set('key', 'my-data')
lruCache.get('key') // 'my-data'
```

It will enforce its logic seemlessly on an async cache as well:
```typescript
const asyncCache = async()(baseCache)
const lruAsyncCache = lru({
  maxSize: 100,
  getItemSize: (item) => 1 // Optional, for dynamic allocation
})(asyncCache)

await lruAsyncCache.set('key', 'my-data')
await lruAsyncCache.get('key') // 'my-data'
```

#### `async()`
Enforces async concurrency for the cache, while also caching its promises.
This is recommended as a top-layer for the cache to ensure a stable usage by the application.
```typescript
const baseCache = cache()
const asyncCache = async()(baseCache)

await asyncCache.set('key', 'my-data')
await asyncCache.get('key') // 'my-data'

const promise1 = asyncCache.get('key1')
const promise2 = asyncCache.get('key2')

console.log(promise1 === promise2) // true
```

#### `lifeCycle()`
Applies lifecycle to the cache items.
This HOF extends the cache API and allows us to set effects when setting new items.

```typescript
const baseCache = cache()
const lifecycleCache = lifeCycle()(baseCache)

lifecycleCache.set('key', 'my-data', [
  // Effect that will log on every read and delete
  ({onRead}) => {
    onRead(() => {
      console.log('log: onRead')
    })
    return () => {
      console.log('log: deleted')
    }
  }
])
lifecycleCache.get('key') // 'my-data'
// "log: onRead"
lifecycleCache.delete('key')
// "deleted"
```

#### `effects(effectsArray)`
Applies an array of effects to the cache.
This mechanism is identical to `lifeCycle`, but it sets a constant list of effects on all items and doesn't allow the flexability of effects-per-item.
```typescript
const baseCache = cache()
const effectsCache = effects([
  // Effect that will log on every read and delete
  ({onRead}) => {
    onRead(() => {
      console.log('log: onRead')
    })
    return () => {
      console.log('log: deleted')
    }
  }
])(baseCache)

effectsCache.set('key', 'my-data') // The set() is a normal set(), we don't get the extra parameter for effects.
effectsCache.get('key') // 'my-data'
// "log: onRead"
effectsCache.delete('key')
// "log: deleted"
```

#### `remote(sourceCache, options)`
Creates a cache with a remote backup.
This is useful if we want to use services like redis to hold a bigger cache than our own, while we consume a portion of it for the application.
```typescript
const sourceCache = source({
  get: async (key) => {
    return await fetch(`https://some.api/data/${key}`)
  }
})

const appCache = lru({maxSize: 100})(baseCache)
const appCacheWithRemote = remote(sourceCache)(appCache)
```

This backup strategy comes with some configurations as well:
```typescript
const appCacheWithRemote = remote(sourceCache, {
  deleteFromSource: false, // When a value is deleted from the cache - don't delete it from the source
  cleanupPolicy: CleanupPolicies.NONE // When the cache is cleaned - don't try to clean the source cache
})(appCache)
```

In terms of `CleanupPolicies`, we have three options:
- `ALL` - When the cache is cleaned, also clean the source cache
- `NONE` - When the cache is cleaned, don't try to clean the source cache at all
- `KEYS` - When the cache is cleaned, only clean the keys that are present in the local front-cache

### Memoization

#### `memo(fn)`
Memoizes a function.
```typescript
const memoizedFunction = memo((a: number, b: number) => a + b)

memoizedFunction(1, 2) // 3
memoizedFunction(1, 2) // 3, but didn't run the function again

memoizedFunction.clean() // This will clear the cache for this function
memoizedFunction(1, 2) // 3, and the function did run again
```

The memo function supports a third parameter, which could be a cache instance.
If we don't provide one, it will create a new one.

Memo function works for async functions as well and will cache promises.

#### `cache(fn, options)`
Caches a function, while dynamically creating a cache instance (if needed).

```typescript
import {cache} from 'celli'

const memoizedFunction = cache((a: number, b: number) => a + b, {
  cacheBy: (a, b) => `${a}-${b}`,
  async: false,
  ttl: 1000,
  lru: 100
})
```

#### Cache options:
When using the `cache` utility, we can provide the following options:

- `cacheBy` - A function that receives the same arguments as the cached function and returns a cache key. If not provided, arguments will be stringified.
- `from` - Function to get an existing cache instance from function arguments. This option is an alternative to the rest of the cache options, since it will use this cache instance instead of creating a new one.
- `via` - Function to get an existing `CacheManager` instance from function arguments, it will dynamically register the cache to the given `CacheManager`.
- `async` - Whether the function is asynchronous. Defaults to false.
- `ttl` - Time-to-live in milliseconds for cached items.
- `lru` - LRU cache configuration:
  - `maxSize` - Maximum number of items to store
  - `getItemSize` - Optional function to calculate item size
- `effects` - Array of effect functions that run on item lifecycle events
- `dispose` - Function called when an item is deleted from cache
- `source` - Another cache to use as a data source

#### `Cache(options)`
Decorator for caching class methods.

This decorator expects either a cache options, or a function that will provide a cache instance from the function's arguments.

#### Cache options:
This is basically a decorator version of `cache` utility, and they share the exact same options.

```typescript
import {Cache} from 'celli'

class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    async: true
    ttl: 1000,
    lru: 100
  })
  async getUserSecret(userId: string) {
    return await fetch(`https://some.api/user/${userId}/secret`)
  }
}
```

#### Cache from context
However, sometimes we would want to work with a specific cache instance.
For this purpose, we can provide a callback that will receive the function's arguments and will extract a cache instance from there.

```typescript
import {createCache} from 'celli'

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

// No need to specify the cache, we will specify where to get it from
class SomeService {
  @Cache({
    cacheBy: (userId) => userId,
    from: (context) => context.cacheRef
  })
  static getUserSecret(context: typeof userContext, userId: string) {
    return fetch(`https://some.api/user/${userId}/secret`)
  }
}
```

**Important:** be careful not to create a cache reference from this `from` callback!
Not only will we not get any memoization (every call uses a different cache), but we'll also consume a lot of memory.

### `CacheManager`
A CacheManager helps manage multiple cache instances and their lifecycles. It provides methods to register/unregister caches, share resources between managers, and clean up resources when they're no longer needed. This is especially useful for managing caches across different sessions or contexts within an application.

#### `createCacheManager(...cacheManagerInstances: CacheManager[])`
Creates a new CacheManager instance.
If provided with other CacheManager instances, it will share their resources.

```typescript
const cacheManager = createCacheManager()

cacheManager.register(...) // Register a cache

const cacheManager2 = createCacheManager(cacheManager)
// cacheManager2 has access to the same caches as cacheManager
```

Every `CacheManager` instance has the following API:

- `cacheManeger.register(cache, ref?)` - Register a cache instance to the manager. Optionally provide a reference key to retrieve this cache later. It uses `Map` so the ref can be any type.
- `cacheManeger.unregister(cache)` - Remove a cache instance from the manager.
- `cacheManeger.getByRef(ref)` - Get a cache by its reference key.
- `cacheManeger.clear()` - Clear all registered cache instances and clean up any non-shared resources. This marks the end of the CacheManager's lifecycle.
- `cacheManeger.onClear(fn)` - Subscribe to the clear event with a callback function.

The CacheManager can manage any object that implements a `clean()` method (known as a "Cleanable"), including cache instances and memoized functions.

### Utility Functions

#### `once(fn)`
Ensures a function is only called once. It works for async functions as well, caching its promise too.
This is not recommended if the function accepts arguments, as it will cache the result based on the function identity.
```typescript
const getCache = once(() => createCache()) // cache instance

const cache1 = getCache() // cache
const cache2 = getCache() // cache

console.log(cache1 === cache2) // true
```

#### `compose(...fns)`
Composes multiple functions into a single function.
It's not that related to the library, but it's a useful utility, especially if we want to combine caches.
This is a pretty common implementation, nothing special here.

### Constants

#### `SourceCleanupPolicies`
Enum for source cleanup policies in remote caches.

### Types and Interfaces

#### `ICache`
Interface for the basic cache structure.

#### `AsyncCache`
Interface for the async cache structure.

#### `AnyCacheType`
Union type for both `ICache`, `AsyncCache` and all the other wrapped strategies.

#### `CacheKey<C>`
Will infer the key type of any cache.

#### `CacheValue<C>`
Will infer the value type of any cache.
