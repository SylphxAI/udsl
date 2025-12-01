# @sylphx/reify

> Transform operations into first-class data.

This is the main package that re-exports everything from the Reify ecosystem.

## Installation

```bash
npm install @sylphx/reify
```

## Usage

```typescript
import {
  pipe, entity, ref, temp, now, branch, inc,
  execute, registerPlugin, entityPlugin
} from '@sylphx/reify';

// Describe operations as data
const workflow = pipe(({ input }) => [
  entity.create("User", {
    id: temp(),
    name: input.name
  }).as("user"),
]);

// Execute with plugins
registerPlugin(entityPlugin);
const result = await execute(workflow, { name: "Alice" });
```

## What's Included

| Export | From |
|--------|------|
| `pipe`, `op`, `ref`, `temp`, `now`, `execute`... | `@sylphx/reify-core` |
| `entity`, `entityPlugin` | `@sylphx/reify-entity` |
| `createCachePlugin` | `@sylphx/reify-adapter-cache` |
| `createPrismaPlugin` | `@sylphx/reify-adapter-prisma` |

## Documentation

See the [main repository](https://github.com/SylphxAI/reify) for full documentation.

## License

MIT
