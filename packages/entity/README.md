# @sylphx/reify-entity

> Entity operations for Reify.

Type-safe CRUD operations represented as data.

## Installation

```bash
npm install @sylphx/reify-entity
```

> **Note**: Most users should install `@sylphx/reify` instead, which includes this package.

## API

### Entity Operations

```typescript
import { entity } from '@sylphx/reify-entity';

// Create
entity.create("User", { name: "Alice" }).as("user")

// Update
entity.update("User", { id: "123", name: "Bob" }).as("user")

// Delete
entity.delete("User", { id: "123" }).as("deleted")

// Upsert
entity.upsert("User", { id: "123", name: "Charlie" }).as("user")
```

### With References

```typescript
import { pipe, ref, temp, now } from '@sylphx/reify-core';
import { entity } from '@sylphx/reify-entity';

const workflow = pipe(({ input }) => [
  entity.create("Order", {
    id: temp(),
    customerId: input.customerId,
    createdAt: now(),
  }).as("order"),

  entity.create("OrderItem", {
    id: temp(),
    orderId: ref("order").id,
    productId: input.productId,
  }).as("item"),
]);
```

### Entity Plugin

```typescript
import { registerPlugin } from '@sylphx/reify-core';
import { entityPlugin } from '@sylphx/reify-entity';

// Register the entity plugin to enable execution
registerPlugin(entityPlugin);
```

The default `entityPlugin` returns the operation data as-is. Use adapter plugins (cache, prisma) for actual execution.

## Documentation

See the [main repository](https://github.com/SylphxAI/reify) for full documentation.

## License

MIT
