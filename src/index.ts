/**
 * UDSL - Universal DSL
 *
 * Language-agnostic, serializable expression language for building data pipelines.
 */

// Types
export type {
	// Value references
	RefInput,
	RefBinding,
	RefNow,
	RefTemp,
	ValueRef,
	// Operators
	OpIncrement,
	OpDecrement,
	OpPush,
	OpPull,
	OpAddToSet,
	OpDefault,
	OpIf,
	Operator,
	// Operations
	OpType,
	OpTypeConditional,
	EntityOperation,
	// Transaction
	NamedOperation,
	Transaction,
	Effect,
	// Multi-entity DSL
	MultiEntityDSL,
} from "./types";

// Type guards
export {
	isRefInput,
	isRefBinding,
	isRefNow,
	isRefTemp,
	isValueRef,
	isOperator,
	isEntityOperation,
	isOpTypeConditional,
	isTransaction,
	isMultiEntityDSL,
} from "./types";

// Builder
export { op, ref, when, pipeline, createInputProxy } from "./builder";

// Evaluator
export type { EvaluationContext, EvaluatedOperation } from "./evaluator";
export {
	resolveValue,
	evaluateOperation,
	evaluateMultiEntityDSL,
	resetTempIdCounter,
	EvaluationError,
} from "./evaluator";
