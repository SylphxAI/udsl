/**
 * @sylphx/reify-core
 *
 * Domain-agnostic primitives for reified operations.
 * Use with domain plugins (entity, email, etc.) for actual operations.
 */

// =============================================================================
// Types
// =============================================================================

export type {
	Conditional,
	DSL,
	// Plugin system
	EffectHandler,
	EvalContext,
	OpAddToSet,
	OpDec,
	OpDefault,
	// Core primitives
	Operation,
	Operator,
	OpIf,
	// Operators
	OpInc,
	OpPull,
	OpPush,
	Pipeline,
	PipelineStep,
	Plugin,
	// Value references
	RefInput,
	RefNow,
	RefResult,
	RefTemp,
	ValueRef,
} from './types'

// Type guards
export {
	isConditional,
	isDSL,
	isOperation,
	isOperator,
	isPipeline,
	isPipelineStep,
	isRefInput,
	isRefNow,
	isRefResult,
	isRefTemp,
	isValueRef,
} from './types'

// =============================================================================
// Builder
// =============================================================================

export type { RefProxy, StepBuilder } from './builder'
export {
	addToSet,
	// Conditional builder
	branch,
	// Internal
	createInputProxy,
	dec,
	defaultTo,
	// Operators
	inc,
	now,
	// Operation builder
	op,
	// Pipeline builder
	pipe,
	pull,
	push,
	// Value references
	ref,
	single,
	temp,
	when,
} from './builder'

// =============================================================================
// Evaluator
// =============================================================================

export type { ConditionalResult, OperationResult, PipelineResult, StepResult } from './evaluator'
export {
	clearPlugins,
	// Errors
	EvaluationError,
	// Execution
	execute,
	executeConditional,
	executeOperation,
	executePipeline,
	getPluginNamespaces,
	// Plugin registry
	registerPlugin,
	resetTempIdCounter,
	// Value resolution
	resolveValue,
	unregisterPlugin,
} from './evaluator'
