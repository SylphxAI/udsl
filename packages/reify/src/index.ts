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
	Conditional,
	ConditionalResult,
	DSL,
	// Plugin system
	EffectHandler,
	EvalContext,
	OpAddToSet,
	OpDec,
	OpDefault,
	// Core primitives
	Operation,
	// Results
	OperationResult,
	Operator,
	OpIf,
	// Operators
	OpInc,
	OpPull,
	OpPush,
	Pipeline,
	PipelineResult,
	PipelineStep,
	Plugin,
	// Value references
	RefInput,
	RefNow,
	RefResult,
	RefTemp,
	// Builder
	StepBuilder,
	StepResult,
	ValueRef,
} from '@sylphx/reify-core'

export {
	addToSet,
	// Conditional builder
	branch,
	clearPlugins,
	// Internal
	createInputProxy,
	dec,
	defaultTo,
	// Errors
	EvaluationError,
	// Execution
	execute,
	executeConditional,
	executeOperation,
	executePipeline,
	getPluginNamespaces,
	// Operators
	inc,
	isConditional,
	isDSL,
	isOperation,
	isOperator,
	isPipeline,
	isPipelineStep,
	// Type guards
	isRefInput,
	isRefNow,
	isRefResult,
	isRefTemp,
	isValueRef,
	now,
	// Operation builder
	op,
	// Pipeline builder
	pipe,
	pull,
	push,
	// Value references
	ref,
	// Plugin registry
	registerPlugin,
	resetTempIdCounter,
	// Value resolution
	resolveValue,
	single,
	temp,
	unregisterPlugin,
	when,
} from '@sylphx/reify-core'

// =============================================================================
// Entity Domain
// =============================================================================

export type {
	CreateArgs,
	DeleteArgs,
	StandardEntity,
	UpdateArgs,
	UpsertArgs,
} from '@sylphx/reify-entity'
export { entity, entityPlugin, isStandardEntity } from '@sylphx/reify-entity'

// =============================================================================
// Adapters
// =============================================================================

export type { CacheLike, CachePluginOptions } from '@sylphx/reify-adapter-cache'
export { createCachePlugin } from '@sylphx/reify-adapter-cache'
export type { PrismaLike, PrismaPluginOptions } from '@sylphx/reify-adapter-prisma'
export { createPrismaPlugin } from '@sylphx/reify-adapter-prisma'
