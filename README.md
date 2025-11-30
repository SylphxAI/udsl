# Reify

> **Reify** = "Reified Operations" — Turn operations into first-class data

**Describe once, execute anywhere with plugins.**

```typescript
import { pipe, entity, ref, temp, now, execute, createCachePlugin } from '@sylphx/reify';

// Describe what you want to do (pure data, no execution)
const createSession = pipe(({ input }) => [
  entity.create("Session", {
    id: temp(),
    title: input.title,
    createdAt: now()
  }).as("session"),

  entity.create("Message", {
    id: temp(),
    sessionId: ref("session").id,
    content: input.content
  }).as("message"),
]);

// Execute with any plugin
const cache = new Map();
await execute(createSession, { title: "Chat", content: "Hello" }, [createCachePlugin(cache)]);
```

## Why Reify?

| Traditional | Reify |
|-------------|-------|
| Logic scattered across client/server | Describe once, execute anywhere |
| Operations disappear after execution | Operations are data (storable, serializable, replayable) |
| Bound to specific runtime | Plugin-based execution |

## Core Concept

```
Builder  →  Pipeline (Data)  →  Executor + Plugin
   ↓              ↓                    ↓
Type-safe    Serializable       Environment-specific
```

**Reify separates "what to do" from "how to do it".**

- **Builder**: Type-safe DSL for describing operations
- **Pipeline**: Plain JavaScript objects (JSON serializable)
- **Executor**: Plugins define how operations are executed

## Installation

```bash
bun add @sylphx/reify
# or
npm install @sylphx/reify
```

## Packages

| Package | Description |
|---------|-------------|
| `@sylphx/reify` | Main package (re-exports everything) |
| `@sylphx/reify-core` | Core: pipe, op, ref, execute... |
| `@sylphx/reify-entity` | Entity domain: entity.create/update/delete |
| `@sylphx/reify-adapter-cache` | Cache adapter for optimistic updates |
| `@sylphx/reify-adapter-prisma` | Prisma adapter for DB operations |

## Features

### Dependency Resolution

Reference results from previous operations:

```typescript
pipe(({ input }) => [
  entity.create("User", { id: temp(), name: input.name }).as("user"),
  entity.create("Profile", {
    id: temp(),
    userId: ref("user").id,  // References the created user's id
    bio: input.bio
  }).as("profile"),
]);
```

### Conditional Execution

Use `branch` for conditional operations:

```typescript
import { branch } from '@sylphx/reify';

pipe(({ input }) => [
  branch(input.sessionId)
    .then(entity.update("Session", { id: input.sessionId }))
    .else(entity.create("Session", { id: temp() }))
    .as("session"),
]);
```

### Atomic Operators

Update operations with built-in operators:

```typescript
import { inc, dec, push, pull, addToSet } from '@sylphx/reify';

pipe(({ input }) => [
  entity.update("User", {
    id: input.userId,
    loginCount: inc(1),      // Increment
    tags: push("verified"),  // Push to array
    score: dec(5),           // Decrement
    badges: addToSet("gold"), // Add unique
  }).as("user"),
]);
```

### Plugin System

Same pipeline, different execution environments:

```typescript
import { execute, createCachePlugin, createPrismaPlugin } from '@sylphx/reify';

// Client: Update cache immediately (optimistic)
await execute(pipeline, input, [createCachePlugin(cache)]);

// Server: Persist to database
await execute(pipeline, input, [createPrismaPlugin(prisma)]);
```

## API Reference

### Builder Functions

| Function | Description |
|----------|-------------|
| `pipe(fn)` | Create operation pipeline |
| `entity.create(type, data)` | Create entity operation |
| `entity.update(type, data)` | Update entity operation |
| `entity.delete(type, id)` | Delete entity operation |
| `entity.upsert(type, data)` | Upsert entity operation |
| `op(name, args)` | Generic operation |
| `branch(cond).then(op).else(op)` | Conditional operation |

### Value References

| Function | Description |
|----------|-------------|
| `input.field` | Reference input data |
| `ref("name").field` | Reference previous result |
| `now()` | Current timestamp |
| `temp()` | Generate temp ID |

### Operators

| Function | Description |
|----------|-------------|
| `inc(n)` | Increment number |
| `dec(n)` | Decrement number |
| `push(...items)` | Push to array |
| `pull(...items)` | Remove from array |
| `addToSet(...items)` | Add unique to array |
| `defaultTo(value)` | Default if undefined |
| `when(cond, then, else?)` | Conditional value |

### Adapters

| Adapter | Use Case |
|---------|----------|
| `createCachePlugin(cache)` | Client-side optimistic updates |
| `createPrismaPlugin(prisma)` | Server-side DB execution |
| `entityPlugin` | Returns operation descriptions (for custom handling) |

## Primary Use Case: Optimistic Updates

Reify is designed for optimistic updates in frameworks like [Lens](https://github.com/SylphxAI/Lens):

```typescript
// In your API framework (e.g., Lens)
import { entity, pipe, temp, ref, now } from '@sylphx/reify';

const sendMessage = pipe(({ input }) => [
  entity.create("Message", {
    id: temp(),
    content: input.content,
    createdAt: now(),
  }).as("message"),
]);

// Server defines the mutation
mutation()
  .optimistic(sendMessage)  // Pipeline is serializable, sent to client
  .resolve(async ({ input }) => {
    // Actual DB operation
    return db.message.create({ data: input });
  });
```

```
Server                          Client
  │                               │
  │ ── Schema with pipeline ──→   │
  │                               │
  │                          User calls mutation
  │                               │
  │                          Execute pipeline on cache
  │                          (instant optimistic update)
  │                               │
  │ ←── Mutation request ────     │
  │                               │
  │ Execute real DB operation     │
  │                               │
  │ ── Real data response ───→    │
  │                               │
  │                          Replace optimistic with real
```

## Serialization

Pipelines are plain JavaScript objects. Serialize however you want:

```typescript
const pipeline = pipe(({ input }) => [...]);

// JSON
const json = JSON.stringify(pipeline);

// Store in DB
await db.operations.insert({ data: pipeline });

// Send over network
ws.send(JSON.stringify({ type: 'mutation', pipeline }));
```

## License

MIT
