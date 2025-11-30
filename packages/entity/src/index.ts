/**
 * @sylphx/reify-entity
 *
 * Entity domain for Reify - CRUD operations for entities.
 */

// Builder
export { entity, isStandardEntity } from "./builder";
export type { StandardEntity } from "./builder";

// Plugin
export { entityPlugin, default } from "./plugin";
export type { CreateArgs, UpdateArgs, DeleteArgs, UpsertArgs } from "./plugin";
