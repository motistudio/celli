# Opis
Goddess of resources and plenty, goddess of cache as well

Opis is a versatile library designed for caching and memoization in various runtime environments. It provides two primary functionalities:

1. Cache Creation and Management:
   - Offers flexible ways to create and manage caches
   - Allows for custom and composable cache configurations

2. Memoization Tools:
   - Includes utilities for function memoization
   - Provides decorators for easy caching of class methods

The library is designed to be flexible and extensible, allowing developers to choose the most appropriate caching strategy based on their specific needs.
It's coming without any external dependencies, perfectly typed and has 100% test coverage. Ensuring high quality and reliability.

## Installation

```bash
npm install opis
```

## Usage

### Memoizing functions in runtime
The main goal of the library is caching functions without effort.
We offer utilities that wrap up most of the API in order to provide easy and quick memoization.

```typescript
import {Cache} from 'opis'

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

This code will create a cache behind the scenes and will memoize getUserSecret method.
We can specify parameters as the following:
- `cacheBy` - function that will be used to determine the cache key
- `async` - if true, the cache will be asynchronous and will enforce async concurrency and cache promises
- `ttl` - time to live for each item
- `lru` - maximum number of items in the cache, it supports `getItemSize` to allow dynamic allocations.
- `dispose` - function that will be called for a deleted item
- `effects` - array of effects that will be applied to each item

But wait! A runtime application needs to manage its resources dynamically.
What if we have different caches or we want to use a cache of our own?

Let's examine such a case with an alternative API:
```typescript
import {createCache} from 'opis'

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

### Basic Cache
Creating a basic cache instance is quite simple:

```typescript
import {createCache} from 'opis'

const cache = createCache() // This is a simple synchronous cache
const asyncCache = createCache({async: true}) // This will produce an async cache
const lruCache = createCache({lru: 100}) // This will produce an LRU cache with 100 items
const ttlCache = createCache({ttl: 1000}) // This will produce a TTL cache with 1000ms ttl
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
const disposeCache = createCache({
  dispose: (client) => {
    // This code will run once when the item is deleted
    client.disconnect()
  }
})

// This will create a cache that leans on another cache for data.
// It's useful if we want to use services like redis to hold a bigger cache than our own, while we consume a portion of it for the application.
const cacheWithBackup = createCache({
  lru: 100,
  backup: anotherCacheFromAnotherService
})
```

And of course, we can combine all of these options together.

### Cache behavior & cleanup
Each cache implements a similar API to Map.
We have some simple methods such as `set`, `get`, `delete` and `has`.
The cache is also iterable, if we need to iterate over its values, keys or entries.
And, we get a special `clean()` method.
This method will not only clear the cache from all its values, but it will also wait for every cleanup operation if we have any.
This is important for memory management and **graceful shutdowns**.

For making things simpler, we also expose a global `clean()` method for all the top-level memoization.
It will clean every memoized function created with `@Cache` decorator, designed to cache shutdowns:

```typescript
import {clean} from 'opis'

process.on('SIGTERM', () => {
  clean()
})
```

### Custom cache composition
In the end, every application has different needs.
It's good practice to have every cache configured with LRU and TTL to avoid memory leaks - but maybe your application needs its own behavior.

For that purpose, we offer a set of utils to compose caches together.
```typescript
import {cache, lru, async, lifeCycle, effects, backup, compose} from 'opis'

const baseCache = cache() // This is a simple synchronous cache
const asyncCache = async()(baseCache) // This will produce an async cache, on top of our base cache
const lruCache = lru({maxSize: 100})(asyncCache) // This will produce an LRU cache with 100 items
const ttlCache = ttl({timeout: 1000})(lruCache) // This will produce a TTL cache with 1000ms ttl
const lifecycleCache = lifeCycle()(ttlCache) // This will produce a cache with lifecycle
const effectsCache = effects([...effects])(lifecycleCache) // This will produce a cache with effects
const backupCache = backup(anotherCacheFromAnotherService)(effectsCache) // This will produce a cache with backup
```
As you can see, every cache could use another one to enforce its logic and strategy.
Each strategy is exposed as a higher order function, so we can use it to wrap up our base cache.

So if we're putting everything together, we'll get:

```typescript
const ultimateCache = compose(
  lru(100),
  ttl(1000),
  lifeCycle(),
  async(),
  effects([...effects]),
  backup(anotherCacheFromAnotherService)
)(baseCache)
```

### Designing a source-cache
As mentioned, we potentially want to be able to lean on bigger caches in another services, such as redis.
For this behavior we've talked about with the usage of `backup` and `source`.

But redis is no cache and we should design it somehow.
For that purpose we've created a `source` cache:

```typescript
import {source} from 'opis'

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

This util helps us to create an `AsyncCache` that will work as a proxy. Then, we could use this cache as a source for another.

Creating a source could happen in two ways. We could either provide a `set` method or not.
Providing a `set` method will make this cache a proxy. It will not save any data by itself, but it will forward the data to the source cache.
If we don't provide a `set` method, having only `get` applied, this cache will act as an `AsyncCache` that will save the data and will use `get` to "introduce" new items if they are requested.

## API Reference

### Cache Creation and Management

#### `cache()`
Creates a basic cache instance.
```typescript
const baseCache = cache()

cache.set('key', 'my-data')
cache.get('key') // 'my-data'
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

#### `backup(sourceCache, options)`
Creates a backup cache with a source cache.
This is useful if we want to use services like redis to hold a bigger cache than our own, while we consume a portion of it for the application.
```typescript
const sourceCache = source({
  get: async (key) => {
    return await fetch(`https://some.api/data/${key}`)
  }
})

const appCache = lru({maxSize: 100})(baseCache)
const appCacheWithBackup = backup(sourceCache)(appCache)
```

This backup strategy comes with some configurations as well:
```typescript
const appCacheWithBackup = backup(sourceCache, {
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

#### `Cache(options)`
Decorator for caching class methods.

This decorator expects either a cache options, or a function that will provide a cache instance from the function's arguments.

#### Cache options:
If we want to create a new cache for a specific function, we will provide cache-options (same API as `createCache`) + an optional `cacheBy` to calculate the key.
```typescript
import {Cache} from 'opis'

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
Otherwise, we will provide a function that will receive the function's arguments and will extract a cache instance from there.
```typescript
import {createCache} from 'opis'

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
Enum for source cleanup policies in backup caches.

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
