# @sylphx/reify-adapter-cache

> In-memory cache executor for Reify operations.

Execute entity operations against an in-memory cache. Useful for client-side state management and optimistic updates.

## Installation

```bash
npm install @sylphx/reify-adapter-cache
```

> **Note**: Most users should install `@sylphx/reify` instead, which includes this package.

## Usage

```typescript
import { pipe, execute, registerPlugin } from '@sylphx/reify-core';
import { entity } from '@sylphx/reify-entity';
import { createCachePlugin } from '@sylphx/reify-adapter-cache';

// Create a cache (Map-like structure)
const cache = new Map();

// Create and register the plugin
const cachePlugin = createCachePlugin(cache);
registerPlugin(cachePlugin);

// Define operations
const workflow = pipe(({ input }) => [
  entity.create("User", {
    id: input.id,
    name: input.name,
  }).as("user"),
]);

// Execute - updates the cache
await execute(workflow, { id: "1", name: "Alice" });

// Cache now contains the user
console.log(cache.get("User:1")); // { id: "1", name: "Alice" }
```

## Supported Operations

| Operation | Behavior |
|-----------|----------|
| `entity.create` | Adds entry to cache |
| `entity.update` | Merges with existing entry |
| `entity.delete` | Removes entry from cache |
| `entity.upsert` | Creates or updates entry |

## Operators

The cache adapter supports atomic operators:

```typescript
entity.update("User", {
  id: "1",
  loginCount: inc(1),      // Increment
  tags: push("verified"),  // Append to array
  roles: addToSet("admin") // Add unique
})
```

## Documentation

See the [main repository](https://github.com/SylphxAI/reify) for full documentation.

## License

MIT
