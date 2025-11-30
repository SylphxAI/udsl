# Reify - Concepts

> **Reify** = "Reified Operations" - 把操作變成 first-class data

## Core Philosophy

**"Describe once, execute anywhere"**

Reify 提供一個 **serializable DSL** 來描述操作。這個 DSL 可以：
- 在定義時不執行，只是數據
- 傳輸到任何地方（server → client）
- 在目標環境用適當的 adapter 執行

## Use Case: Optimistic Updates

```
┌─────────────────────────────────────────────────────────────┐
│  Server (定義)                                               │
│                                                             │
│  mutation()                                                 │
│    .optimistic(pipeline)  ← Reify DSL (描述 optimistic)      │
│    .resolve(...)          ← 真正的 DB 操作 (Prisma/SQL)       │
│                                                             │
│  Pipeline 是 serializable，可以傳給 client                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Pipeline DSL (JSON) 傳到 client
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Client (執行)                                               │
│                                                             │
│  1. 收到 mutation 調用                                       │
│  2. 從 server schema 拿到 optimistic pipeline                │
│  3. 用 Reify execute() + createCachePlugin() 執行            │
│  4. 立即更新 local cache (optimistic)                        │
│  5. 同時發送請求到 server                                     │
│  6. Server 返回真實數據 → 更新 cache                          │
└─────────────────────────────────────────────────────────────┘
```

## What Reify IS

- ✅ **DSL Builder**: `entity.create()`, `pipe()`, `branch()`, `ref()`, `temp()`...
- ✅ **Serializable**: Pipeline 是 JSON，可以傳輸
- ✅ **Plugin System**: 不同環境用不同 adapter 執行同一個 DSL
- ✅ **Executor**: `execute()` 函數配合 plugin 執行 DSL

## What Reify is NOT

- ❌ **Not an ORM**: 不直接操作 DB
- ❌ **Not a query builder**: 不是 Prisma/Drizzle 那種
- ❌ **Not tied to any framework**: 獨立庫，可被任何框架使用

## Relationship with Lens

```
Lens 用 Reify 就像 tRPC 用 Zod

tRPC:
  - 用 Zod 定義 input schema
  - 內部用 zod.parse() 做 validation
  - 用戶直接 import from 'zod'

Lens:
  - 用 Reify 定義 optimistic DSL
  - 內部用 reify execute() 做 cache update
  - 用戶直接 import from '@sylphx/reify'
```

Lens **不應該**：
- ❌ Re-export Reify API
- ❌ 改名 Reify 的東西
- ❌ 包裝 Reify API

Lens **應該**：
- ✅ 接受 Reify pipeline 作為參數
- ✅ 內部用 Reify 執行 optimistic updates
- ✅ 用戶直接 import from `@sylphx/reify`

## Package Structure

```
@sylphx/reify              ← Convenience re-export (用戶 import 這個)
├── @sylphx/reify-core     ← Core: pipe, op, ref, temp, execute...
├── @sylphx/reify-entity   ← Entity domain: entity.create/update/delete
├── @sylphx/reify-adapter-cache   ← Cache adapter (for client)
└── @sylphx/reify-adapter-prisma  ← Prisma adapter (optional, for server)
```

## DSL Example

```typescript
import { entity, pipe, temp, ref, now, branch, inc } from '@sylphx/reify';

// 定義 pipeline (純數據，不執行)
const sendMessagePipeline = pipe(({ input }) => [
  // Step 1: Upsert session
  branch(input.sessionId)
    .then(entity.update('Session', { id: input.sessionId }))
    .else(entity.create('Session', { id: temp(), title: input.title }))
    .as('session'),

  // Step 2: Create message (ref session from step 1)
  entity.create('Message', {
    id: temp(),
    sessionId: ref('session').id,
    content: input.content,
    createdAt: now(),
  }).as('message'),

  // Step 3: Update user stats
  entity.update('User', {
    id: input.userId,
    messageCount: inc(1),
  }).as('userStats'),
]);

// Pipeline 是 JSON，可以 serialize
console.log(JSON.stringify(sendMessagePipeline));
```

## Execution

```typescript
import { execute, createCachePlugin } from '@sylphx/reify';

// Client side: 用 cache adapter 執行
const cachePlugin = createCachePlugin(localCache);
const result = await execute(pipeline, { input }, [cachePlugin]);

// 結果包含每個 step 的 output
// result.session, result.message, result.userStats
```

## Key Concepts

### 1. Pipeline
一系列有序的操作步驟，可以互相引用結果。

### 2. Operation
單個操作，如 `entity.create('User', {...})`。

### 3. References
- `input.field` - 引用 mutation input
- `ref('step').field` - 引用前面步驟的結果
- `temp()` - 生成臨時 ID
- `now()` - 當前時間戳

### 4. Operators
- `inc(n)` - 遞增
- `dec(n)` - 遞減
- `push(item)` - 添加到數組
- `pull(item)` - 從數組移除
- `addToSet(item)` - 唯一添加

### 5. Conditional
- `branch(condition).then(op).else(op)` - 條件操作
- `when(condition, value)` - 條件值

### 6. Plugin
Adapter that knows how to execute operations in a specific environment:
- `createCachePlugin(cache)` - 執行對 cache 的操作
- `createPrismaPlugin(prisma)` - 執行對 Prisma 的操作
