# @sylphx/reify-adapter-prisma

> Prisma database executor for Reify operations.

Execute entity operations against a Prisma database.

## Installation

```bash
npm install @sylphx/reify-adapter-prisma
```

> **Note**: Most users should install `@sylphx/reify` instead, which includes this package.

## Usage

```typescript
import { PrismaClient } from '@prisma/client';
import { pipe, execute, registerPlugin } from '@sylphx/reify-core';
import { entity } from '@sylphx/reify-entity';
import { createPrismaPlugin } from '@sylphx/reify-adapter-prisma';

// Create Prisma client
const prisma = new PrismaClient();

// Create and register the plugin
const prismaPlugin = createPrismaPlugin(prisma);
registerPlugin(prismaPlugin);

// Define operations
const workflow = pipe(({ input }) => [
  entity.create("User", {
    name: input.name,
    email: input.email,
  }).as("user"),
]);

// Execute - writes to database
const result = await execute(workflow, {
  name: "Alice",
  email: "alice@example.com"
});
```

## Supported Operations

| Operation | Prisma Method |
|-----------|---------------|
| `entity.create` | `prisma.model.create()` |
| `entity.update` | `prisma.model.update()` |
| `entity.delete` | `prisma.model.delete()` |
| `entity.upsert` | `prisma.model.upsert()` |

## Configuration

```typescript
const prismaPlugin = createPrismaPlugin(prisma, {
  // Optional: Custom model name mapping
  getModel: (type) => type.toLowerCase(),
});
```

## Documentation

See the [main repository](https://github.com/SylphxAI/reify) for full documentation.

## License

MIT
