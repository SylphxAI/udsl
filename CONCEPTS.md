# Concepts

This document explores the foundational ideas behind Reify.

---

## What is Reification?

**Reification** is the act of making something abstract into something concrete.

In philosophy, it means treating concepts as if they were real, tangible things. In programming, we extend this idea: **operations themselves become tangible objects**.

Consider a simple database write:

```typescript
await db.user.create({ name: "Alice" });
```

This operation executes and vanishes. It leaves behind an effect (a new row in the database), but the operation itself—the intent, the structure, the meaning—is gone forever.

Reify preserves it:

```typescript
const operation = entity.create("User", { name: "Alice" });
// The operation exists as data
// It can be inspected, stored, transmitted, transformed
// And eventually, executed
```

---

## The Three Layers

Reify separates concerns into three distinct layers:

```
┌─────────────────────────────────────────────────────┐
│                    BUILDER                          │
│                                                     │
│  Type-safe DSL for constructing operations          │
│  pipe(), entity.create(), ref(), temp()...          │
│                                                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      │  produces
                      ▼
┌─────────────────────────────────────────────────────┐
│                    DATA                             │
│                                                     │
│  Plain JavaScript objects (JSON-serializable)       │
│  The universal representation of operations         │
│                                                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      │  consumed by
                      ▼
┌─────────────────────────────────────────────────────┐
│                   EXECUTOR                          │
│                                                     │
│  Plugins that interpret and execute operations      │
│  execute() + plugin system                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Builder Layer

The builder provides a **type-safe, ergonomic interface** for constructing operations. It uses TypeScript's type system to ensure correctness at compile time.

```typescript
const op = entity.create("User", {
  id: temp(),           // TypeScript knows this is a temp reference
  name: input.name,     // TypeScript knows this references input
  createdAt: now(),     // TypeScript knows this is a timestamp
});
```

The builder doesn't execute anything. It produces data.

### Data Layer

The data layer is the **heart of Reify**. Operations exist as plain JavaScript objects that can be:

- **Serialized**: `JSON.stringify(operation)`
- **Stored**: Save to database, file, or any storage
- **Transmitted**: Send over HTTP, WebSocket, message queue
- **Inspected**: Log, debug, analyze
- **Transformed**: Modify, filter, compose

```typescript
// An operation is just data
{
  "$do": "entity.create",
  "$with": {
    "type": "User",
    "name": { "$input": "name" }
  },
  "$as": "user"
}
```

This data is **environment-agnostic**. It doesn't know or care where it will be executed.

### Executor Layer

The executor **interprets** operation data and produces effects. Different executors (plugins) can interpret the same operation differently:

```typescript
// Same operation
const op = entity.create("User", { name: "Alice" });

// Different interpretations
cachePlugin:  → Updates in-memory cache
prismaPlugin: → Writes to database via Prisma
logPlugin:    → Logs the operation
mockPlugin:   → Returns mock data for testing
```

---

## Data Representations

### Value References

Operations often need to reference dynamic values. Reify provides several reference types:

| Reference | JSON Representation | Purpose |
|-----------|---------------------|---------|
| `input.field` | `{ "$input": "field" }` | Access input data |
| `ref("step").field` | `{ "$ref": "step.field" }` | Reference previous result |
| `temp()` | `{ "$temp": true }` | Generate temporary ID |
| `now()` | `{ "$now": true }` | Current timestamp |

### Operators

Operators represent **atomic transformations** that can be applied during execution:

| Operator | JSON Representation | Semantics |
|----------|---------------------|-----------|
| `inc(1)` | `{ "$inc": 1 }` | Add to current value |
| `dec(1)` | `{ "$dec": 1 }` | Subtract from current value |
| `push("x")` | `{ "$push": "x" }` | Append to array |
| `pull("x")` | `{ "$pull": "x" }` | Remove from array |
| `addToSet("x")` | `{ "$addToSet": "x" }` | Add if not present |

### Conditionals

Conditional logic is also represented as data:

```typescript
// Builder
branch(input.exists)
  .then(entity.update(...))
  .else(entity.create(...))
  .as("result")

// Data
{
  "$when": { "$input": "exists" },
  "$then": { "$do": "entity.update", ... },
  "$else": { "$do": "entity.create", ... },
  "$as": "result"
}
```

---

## Pipeline Execution

A pipeline is a sequence of operations that may reference each other:

```typescript
const pipeline = pipe(({ input }) => [
  entity.create("Order", { id: temp() }).as("order"),
  entity.create("Item", { orderId: ref("order").id }).as("item"),
]);
```

Execution proceeds **sequentially**, building up a context of results:

```
Step 1: Execute "order" operation
        → Result stored as ctx.refs["order"]

Step 2: Execute "item" operation
        → ref("order").id resolved from ctx.refs["order"]
        → Result stored as ctx.refs["item"]

Final:  Return all step results
```

### Reference Resolution

Before each step executes, all references are resolved:

1. `{ "$input": "field" }` → Look up in input data
2. `{ "$ref": "step.field" }` → Look up in previous results
3. `{ "$temp": true }` → Generate unique ID
4. `{ "$now": true }` → Get current timestamp

---

## Plugin Architecture

Plugins register **effect handlers** organized by namespace:

```typescript
interface Plugin {
  namespace: string;
  effects: {
    [effectName: string]: EffectHandler;
  };
}

type EffectHandler = (args: unknown, ctx: ExecutionContext) => Promise<unknown>;
```

### Example Plugin

```typescript
const entityPlugin = {
  namespace: "entity",
  effects: {
    create: async (args, ctx) => {
      // args = { type: "User", name: "Alice", ... }
      // Return whatever makes sense for this environment
      return { ...args, id: generateId() };
    },
    update: async (args, ctx) => { ... },
    delete: async (args, ctx) => { ... },
  },
};
```

### Effect Resolution

When an operation like `entity.create` executes:

1. Parse effect name: `"entity.create"` → namespace `"entity"`, effect `"create"`
2. Find plugin with matching namespace
3. Call the effect handler with resolved arguments
4. Store result for potential reference by later steps

---

## Design Decisions

### Why Data, Not Functions?

Functions are opaque. You cannot inspect what a function will do without executing it. Data is transparent—you can examine, transform, and reason about it.

```typescript
// Function: opaque
const fn = () => db.user.create({ name: "Alice" });
// What does this do? We must execute to find out.

// Data: transparent
const op = { type: "create", entity: "User", data: { name: "Alice" } };
// We can inspect, validate, transform before execution.
```

### Why Plugins?

Different environments have different capabilities and constraints:

- **Browser**: No direct database access
- **Server**: Full database access
- **Test**: No real infrastructure
- **Preview**: Dry-run, no side effects

Plugins allow the same operation to adapt to its environment.

### Why Sequential Execution?

Operations in a pipeline often depend on each other. Sequential execution with reference resolution provides:

1. **Predictability**: Operations execute in defined order
2. **Composability**: Later operations can reference earlier results
3. **Debuggability**: Each step can be inspected independently

---

## Comparison

### vs. Redux Actions

Redux actions are also "operations as data," but:

- Redux actions describe **state transitions**, Reify describes **effects**
- Redux requires a central store, Reify is store-agnostic
- Redux reducers are synchronous, Reify handlers are async

### vs. GraphQL Mutations

GraphQL mutations describe operations, but:

- GraphQL is tied to a schema and server
- Reify is runtime and environment agnostic
- Reify operations can execute anywhere, not just on a GraphQL server

### vs. Event Sourcing

Event sourcing stores events as the source of truth:

- Events describe **what happened** (past)
- Reify operations describe **what to do** (intent)
- Reify can be used to implement event sourcing

---

## Summary

Reify is built on a simple but powerful idea: **operations should be data**.

This enables:

- **Inspection**: See what will happen before it happens
- **Storage**: Keep a record of all operations
- **Transmission**: Send operations across boundaries
- **Replay**: Re-execute operations from history
- **Transformation**: Modify operations programmatically
- **Portability**: Execute anywhere with appropriate plugins

The separation into Builder → Data → Executor creates a clean architecture where each layer has a single responsibility, and the data layer serves as the universal interface between intent and execution.
