/**
 * Reify - Reified Mutations
 *
 * Describe operations once, execute anywhere with plugins.
 *
 * This is the convenience package that re-exports everything.
 * For fine-grained control, use individual packages:
 * - @sylphx/reify-core - Core types, builder, evaluator
 * - @sylphx/reify-entity - Entity domain (CRUD operations)
 * - @sylphx/reify-adapter-cache - Cache adapter
 * - @sylphx/reify-adapter-prisma - Prisma adapter
 */

// =============================================================================
// Core - Types, Builder, Evaluator
// =============================================================================

export type {
	// Value references
	RefInput,
	RefResult,
	RefNow,
	RefTemp,
	ValueRef,
	// Operators
	OpInc,
	OpDec,
	OpPush,
	OpPull,
	OpAddToSet,
	OpDefault,
	OpIf,
	Operator,
	// Core primitives
	Operation,
	Conditional,
	PipelineStep,
	Pipeline,
	DSL,
	// Plugin system
	EffectHandler,
	Plugin,
	EvalContext,
	// Builder
	StepBuilder,
	// Results
	OperationResult,
	ConditionalResult,
	StepResult,
	PipelineResult,
} from "@sylphx/reify-core";

export {
	// Type guards
	isRefInput,
	isRefResult,
	isRefNow,
	isRefTemp,
	isValueRef,
	isOperator,
	isOperation,
	isConditional,
	isPipelineStep,
	isPipeline,
	isDSL,
	// Pipeline builder
	pipe,
	single,
	// Operation builder
	op,
	// Conditional builder
	branch,
	// Value references
	ref,
	now,
	temp,
	// Operators
	inc,
	dec,
	push,
	pull,
	addToSet,
	defaultTo,
	when,
	// Internal
	createInputProxy,
	// Plugin registry
	registerPlugin,
	unregisterPlugin,
	clearPlugins,
	getPluginNamespaces,
	// Execution
	execute,
	executePipeline,
	executeOperation,
	executeConditional,
	// Value resolution
	resolveValue,
	resetTempIdCounter,
	// Errors
	EvaluationError,
} from "@sylphx/reify-core";

// =============================================================================
// Entity Domain
// =============================================================================

export { entity, entityPlugin, isStandardEntity } from "@sylphx/reify-entity";
export type { StandardEntity, CreateArgs, UpdateArgs, DeleteArgs, UpsertArgs } from "@sylphx/reify-entity";

// =============================================================================
// Adapters
// =============================================================================

export { createCachePlugin } from "@sylphx/reify-adapter-cache";
export type { CacheLike, CachePluginOptions } from "@sylphx/reify-adapter-cache";

export { createPrismaPlugin } from "@sylphx/reify-adapter-prisma";
export type { PrismaLike, PrismaPluginOptions } from "@sylphx/reify-adapter-prisma";
