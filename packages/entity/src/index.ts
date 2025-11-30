/**
 * @sylphx/reify-entity
 *
 * Entity domain for Reify - CRUD operations for entities.
 */

export type { StandardEntity } from './builder'
// Builder
export { entity, isStandardEntity } from './builder'
export type { CreateArgs, DeleteArgs, UpdateArgs, UpsertArgs } from './plugin'
// Plugin
export { default, entityPlugin } from './plugin'
