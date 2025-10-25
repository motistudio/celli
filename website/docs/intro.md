---
sidebar_position: 1
slug: /intro
---

# Introduction

Welcome to **Celli** - a versatile library designed for caching and memoization in various runtime environments.

> Derived from the Latin word "cella", meaning "storage"

## Why Celli?

Celli provides two primary functionalities:

1. **Cache creation and management**:
   - Offers flexible ways to create and manage caches
   - Provides utils to create a custom cache in a composable manner

2. **Memoization tools & decorators**:
   - Offers utilities for function memoization, taking advantage of the flexible cache creation API
   - Built-in cache invalidations configurations for maintaining low memory consumption, taking the application's lifecycle into account

## Key Features

- **Zero Dependencies**: Minified file weighs only 19kb
- **Perfectly Typed**: Full TypeScript support with comprehensive types
- **100% Test Coverage**: High reliability with no unexpected edge cases
- **Flexible & Extensible**: Choose the most appropriate caching strategy based on your specific needs
- **Production Ready**: Built-in support for graceful shutdowns and resource cleanup

## Installation

```bash
npm install celli --save
```

## Quick Example

Here's a quick example of how to use Celli for function memoization:

```typescript
import {Cache} from 'celli'

class SomeService {
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

Or using the functional approach:

```typescript
import {cache} from 'celli'

const getUserSecret = cache((userId: string) => fetch(`https://some.api/user/${userId}/secret`), {
  cacheBy: (userId) => userId,
  async: true,
  ttl: 1000,
  lru: 100
})
```

## Next Steps

- [Getting Started](./getting-started/installation.md) - Learn how to install and set up Celli
- [Basic Usage](./getting-started/basic-usage.md) - Start with simple memoization examples
- [API Reference](./api/overview.md) - Explore the complete API documentation
