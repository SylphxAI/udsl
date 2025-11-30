/**
 * @sylphx/reify-entity
 *
 * Entity domain for Reify - CRUD operations for entities.
 */

// Builder
export { entity } from "./builder";

// Plugin
export { entityPlugin, default } from "./plugin";
export type { CreateArgs, UpdateArgs, DeleteArgs, UpsertArgs } from "./plugin";
