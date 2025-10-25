---
sidebar_position: 1
---

# Installation

Getting started with Celli is straightforward.

## Requirements

- Node.js version 14.0 or above
- npm, yarn, or pnpm

## Install via npm

```bash
npm install celli --save
```

## Install via yarn

```bash
yarn add celli
```

## Install via pnpm

```bash
pnpm add celli
```

## Verify Installation

Once installed, you can verify the installation by importing Celli in your project:

```typescript
import {cache, createCache, Cache} from 'celli'

console.log('Celli is ready to use!')
```

## TypeScript Support

Celli is written in TypeScript and comes with full type definitions out of the box. No additional `@types` packages are needed.

## Next Steps

Now that you have Celli installed, let's explore how to use it:

- [Basic Usage](./basic-usage.md) - Learn the fundamentals of memoization with Celli
- [Cache Creation](./cache-creation.md) - Understand how to create and configure caches
