# UDSL - Universal DSL

Language-agnostic, serializable expression language for building data pipelines.

## Features

- **Pure JSON output** - DSL compiles to plain JSON, no runtime dependencies
- **Type-safe builder** - TypeScript builder with full type inference
- **Plugin system** - Extensible via plugins (entity, http, custom)
- **Cross-language** - JSON spec can be evaluated in any language

## Installation

```bash
bun add @sylphx/udsl
```

## Quick Start

```typescript
import { pipe, entity, ref, now, execute, registerPlugin, entityPlugin } from '@sylphx/udsl';

// Register the entity plugin
registerPlugin(entityPlugin);

// Define a pipeline (compiles to JSON at define-time)
const dsl = pipe(({ input }) => [
  entity.create("Session", {
    title: input.title,
    createdAt: now(),
  }).as("session"),

  entity.create("Message", {
    sessionId: ref("session").id,
    content: input.content,
  }).as("message"),
]);

// Output is pure JSON:
// {
//   $pipe: [
//     { $do: "entity.create", $with: { type: "Session", ... }, $as: "session" },
//     { $do: "entity.create", $with: { type: "Message", ... }, $as: "message" }
//   ]
// }

// Execute with input data
const result = await execute(dsl, { title: 'Hello', content: 'World' });
```

## Core Primitives

UDSL has only 5 core primitives:

| Primitive | Description |
|-----------|-------------|
| `$do` | Effect to execute (namespaced, e.g., "entity.create") |
| `$with` | Arguments for the effect |
| `$as` | Name this result for later reference |
| `$when` | Only execute if condition is truthy |
| `$pipe` | Sequence of operations |

## Value References

| Syntax | JSON Output | Description |
|--------|-------------|-------------|
| `input.field` | `{ $input: "field" }` | Reference input data |
| `ref("name").field` | `{ $ref: "name.field" }` | Reference previous result |
| `now()` | `{ $now: true }` | Current timestamp |
| `temp()` | `{ $temp: true }` | Generate temp ID |

## Operators

| Syntax | JSON Output | Description |
|--------|-------------|-------------|
| `inc(n)` | `{ $inc: n }` | Increment number |
| `dec(n)` | `{ $dec: n }` | Decrement number |
| `push(...items)` | `{ $push: items }` | Push to array |
| `pull(...items)` | `{ $pull: items }` | Pull from array |
| `addToSet(...items)` | `{ $addToSet: items }` | Add to set |
| `defaultTo(value)` | `{ $default: value }` | Default if undefined |
| `when(cond, then, else?)` | `{ $if: {...} }` | Conditional value |

## Plugin System

UDSL is extensible via plugins:

```typescript
import { registerPlugin } from '@sylphx/udsl';

// Register custom plugin
registerPlugin({
  namespace: "http",
  effects: {
    get: async (args, ctx) => {
      const response = await fetch(args.url);
      return response.json();
    },
    post: async (args, ctx) => {
      const response = await fetch(args.url, {
        method: 'POST',
        body: JSON.stringify(ctx.resolve(args.body)),
      });
      return response.json();
    },
  },
});

// Use in pipeline
const dsl = pipe(({ input }) => [
  op("http.post", { url: "/api/users", body: input.data }).as("response"),
]);
```

### Built-in Plugins

#### Entity Plugin (Descriptive)

Returns operation descriptions. Use for defining what to do:

```typescript
import { entityPlugin, registerPlugin } from '@sylphx/udsl';

registerPlugin(entityPlugin);

// Available effects: entity.create, entity.update, entity.delete, entity.upsert
```

### Adapters (Execution)

Pre-built plugins that actually execute effects:

#### Prisma Adapter

```typescript
import { PrismaClient } from "@prisma/client";
import { createPrismaPlugin, registerPlugin, execute, pipe, entity } from '@sylphx/udsl';

const prisma = new PrismaClient();
registerPlugin(createPrismaPlugin(prisma));

const dsl = pipe(({ input }) => [
  entity.create("User", { name: input.name, email: input.email }).as("user"),
]);

// Actually creates in database
const result = await execute(dsl, { name: "John", email: "john@example.com" });
console.log(result.result.user); // { id: "...", name: "John", email: "..." }
```

#### Cache Adapter

For client-side optimistic updates:

```typescript
import { createCachePlugin, registerPlugin, execute, pipe, entity, inc } from '@sylphx/udsl';

const cache = new Map();
registerPlugin(createCachePlugin(cache));

const dsl = pipe(({ input }) => [
  entity.create("User", { name: input.name }).as("user"),
  entity.update("User", { id: ref("user").id, loginCount: inc(1) }).as("updated"),
]);

// Updates cache immediately (optimistic)
await execute(dsl, { name: "John" });
console.log(cache.get("User:temp_1")); // { id: "temp_1", name: "John", loginCount: 1 }
```

### Writing Custom Plugins

```typescript
import { registerPlugin, type Plugin } from '@sylphx/udsl';

const myPlugin: Plugin = {
  namespace: "myservice",
  effects: {
    // Sync effect
    validate: (args, ctx) => {
      const data = ctx.resolve(args.data);
      if (!data.email) throw new Error("Email required");
      return { valid: true };
    },

    // Async effect
    send: async (args, ctx) => {
      const email = ctx.resolve(args.email);
      await sendEmail(email);
      return { sent: true };
    },
  },
};

registerPlugin(myPlugin);

// Use in pipeline
const dsl = pipe(({ input }) => [
  op("myservice.validate", { data: input }).as("validation"),
  op("myservice.send", { email: input.email }).as("email").only(ref("validation").valid),
]);
```

## Conditional Execution

```typescript
const dsl = pipe(({ input }) => [
  entity.create("Session", { title: input.title })
    .as("session")
    .only(input.shouldCreate),  // Only execute if truthy
]);
```

## JSON Schema

The DSL compiles to this JSON structure:

```typescript
interface Pipeline {
  $pipe: Operation[];
  $return?: Record<string, unknown>;
}

interface Operation {
  $do: string;                    // Effect name (namespaced)
  $with?: Record<string, unknown>; // Arguments
  $as?: string;                   // Result name
  $when?: unknown;                // Condition
}

type ValueRef =
  | { $input: string }  // Input reference
  | { $ref: string }    // Result reference
  | { $now: true }      // Timestamp
  | { $temp: true };    // Temp ID
```

## Why UDSL?

- **Universal**: Core primitives work for any domain (entity CRUD, HTTP, workflows)
- **Serializable**: Pure JSON, can be stored in DB, sent over network
- **Cross-language**: Evaluate in TypeScript, Python, Go, Rust, etc.
- **Type-safe**: Full TypeScript support with the builder API
- **Extensible**: Plugin system for custom effects

## License

MIT
