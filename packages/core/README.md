# @sylphx/reify-core

> Core primitives for reified operations.

This package provides the foundational building blocks for transforming operations into inspectable, serializable data.

## Installation

```bash
npm install @sylphx/reify-core
```

> **Note**: Most users should install `@sylphx/reify` instead, which includes this package.

## API

### Pipeline Construction

```typescript
import { pipe, op } from '@sylphx/reify-core';

const workflow = pipe(({ input }) => [
  op("myEffect", { data: input.data }).as("result"),
]);
```

### Value References

```typescript
import { ref, temp, now } from '@sylphx/reify-core';

{
  id: temp(),           // Generate temporary ID
  createdAt: now(),     // Current timestamp
  userId: ref("user").id  // Reference previous result
}
```

### Operators

```typescript
import { inc, dec, push, pull, addToSet, when } from '@sylphx/reify-core';

{
  count: inc(1),           // Increment
  score: dec(5),           // Decrement
  tags: push("new"),       // Append to array
  roles: addToSet("admin") // Add unique
}
```

### Execution

```typescript
import { execute, registerPlugin, clearPlugins } from '@sylphx/reify-core';

registerPlugin(myPlugin);
const result = await execute(workflow, input);
```

### Plugin Interface

```typescript
import type { Plugin, EffectHandler } from '@sylphx/reify-core';

const myPlugin: Plugin = {
  namespace: "myNamespace",
  effects: {
    myEffect: async (args, ctx) => {
      return { ...args, processed: true };
    },
  },
};
```

## Documentation

See the [main repository](https://github.com/SylphxAI/reify) for full documentation.

## License

MIT
