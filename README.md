# UDSL - Universal DSL

Language-agnostic, serializable expression language for building data pipelines.

## Features

- **Pure JSON output** - DSL compiles to plain JSON, no runtime dependencies
- **Type-safe builder** - TypeScript builder with full type inference
- **Cross-language** - JSON spec can be evaluated in any language
- **Composable** - Pipeline operations with dependencies via `$ref`

## Installation

```bash
bun add @sylphx/udsl
```

## Quick Start

```typescript
import { pipeline, op, ref, evaluateMultiEntityDSL } from '@sylphx/udsl';

// Define a pipeline (compiles to JSON at define-time)
const dsl = pipeline(({ input }) => [
  op.create('Session', {
    title: input.title,
    createdAt: ref.now(),
  }).as('session'),

  op.create('Message', {
    sessionId: ref.from('session').id,
    content: input.content,
  }).as('message'),
]);

// Output is pure JSON:
// {
//   session: { $entity: 'Session', $op: 'create', title: { $input: 'title' }, ... },
//   message: { $entity: 'Message', $op: 'create', sessionId: { $ref: 'session.id' }, ... }
// }

// Evaluate with input data
const results = evaluateMultiEntityDSL(dsl, {
  input: { title: 'Hello', content: 'World' }
});
```

## DSL Reference

### Value References

| Syntax | Description |
|--------|-------------|
| `input.field` | Reference input data → `{ $input: 'field' }` |
| `ref.from('name').field` | Reference sibling operation → `{ $ref: 'name.field' }` |
| `ref.now()` | Current timestamp → `{ $now: true }` |
| `ref.temp()` | Generate temp ID → `{ $temp: true }` |

### Operators

| Syntax | Description |
|--------|-------------|
| `ref.increment(n)` | Increment number → `{ $increment: n }` |
| `ref.decrement(n)` | Decrement number → `{ $decrement: n }` |
| `ref.push(...items)` | Push to array → `{ $push: items }` |
| `ref.pull(...items)` | Pull from array → `{ $pull: items }` |
| `ref.addToSet(...items)` | Add to set → `{ $addToSet: items }` |
| `ref.default(value)` | Default if undefined → `{ $default: value }` |
| `ref.if(cond, then, else?)` | Conditional → `{ $if: { condition, then, else } }` |

### Operations

| Syntax | Description |
|--------|-------------|
| `op.create(entity, data)` | Create entity |
| `op.update(entity, { id, ...data })` | Update entity by ID |
| `op.delete(entity, id)` | Delete entity by ID |
| `op.upsert(entity, { id, ...data })` | Create or update |
| `op.updateMany(entity, { where?, ids?, data })` | Bulk update |

### Conditionals

```typescript
when(input.sessionId)
  .then([op.update('Session', { id: input.sessionId }).as('session')])
  .else([op.create('Session', { title: input.title }).as('session')])
```

## JSON Schema

The DSL compiles to this JSON structure:

```typescript
interface MultiEntityDSL {
  [operationName: string]: {
    $entity: string;           // Entity type
    $op: OpType | { $if: ... }; // Operation type
    $id?: string | ValueRef;   // ID for update/delete
    $ids?: string[];           // IDs for bulk
    $where?: object;           // Where clause for bulk
    [field: string]: unknown;  // Data fields
  }
}

type OpType = 'create' | 'update' | 'delete' | 'upsert';

type ValueRef =
  | { $input: string }  // Input reference
  | { $ref: string }    // Sibling reference
  | { $now: true }      // Timestamp
  | { $temp: true };    // Temp ID
```

## Cross-Language Evaluation

The JSON output can be evaluated in any language. See the [evaluator spec](./SPEC.md) for implementation details.

## License

MIT
