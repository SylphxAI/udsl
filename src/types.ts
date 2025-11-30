/**
 * UDSL - Universal DSL Type Definitions
 *
 * Language-agnostic, serializable expression language.
 * All types here map 1:1 to JSON - no JavaScript-specific constructs.
 */

// =============================================================================
// Value References - How to get values
// =============================================================================

/** Reference to input data: { $input: "path.to.field" } */
export interface RefInput {
	$input: string;
}

/** Reference to a named binding: { $ref: "bindingName.field" } */
export interface RefBinding {
	$ref: string;
}

/** Current timestamp: { $now: true } */
export interface RefNow {
	$now: true;
}

/** Generate temporary ID: { $temp: true } */
export interface RefTemp {
	$temp: true;
}

/** Any value reference */
export type ValueRef = RefInput | RefBinding | RefNow | RefTemp;

// =============================================================================
// Operators - Transform values
// =============================================================================

/** Increment number: { $increment: 1 } */
export interface OpIncrement {
	$increment: number;
}

/** Decrement number: { $decrement: 1 } */
export interface OpDecrement {
	$decrement: number;
}

/** Push to array: { $push: value } or { $push: [values] } */
export interface OpPush {
	$push: unknown;
}

/** Pull from array: { $pull: value } or { $pull: [values] } */
export interface OpPull {
	$pull: unknown;
}

/** Add to set (push if not exists): { $addToSet: value } */
export interface OpAddToSet {
	$addToSet: unknown;
}

/** Default value if undefined: { $default: value } */
export interface OpDefault {
	$default: unknown;
}

/** Conditional value: { $if: { condition, then, else? } } */
export interface OpIf {
	$if: {
		condition: unknown;
		then: unknown;
		else?: unknown;
	};
}

/** Any operator */
export type Operator = OpIncrement | OpDecrement | OpPush | OpPull | OpAddToSet | OpDefault | OpIf;

// =============================================================================
// Operations - CRUD actions
// =============================================================================

/** Operation type */
export type OpType = "create" | "update" | "delete" | "upsert";

/** Conditional operation type */
export interface OpTypeConditional {
	$if: {
		condition: unknown;
		then: OpType;
		else: OpType;
	};
}

/** Entity operation - a single CRUD action */
export interface EntityOperation {
	/** Target entity type */
	$entity: string;
	/** Operation type */
	$op: OpType | OpTypeConditional;
	/** Single ID for update/delete */
	$id?: string | ValueRef;
	/** Multiple IDs for bulk operations */
	$ids?: string[] | ValueRef;
	/** Where clause for bulk operations */
	$where?: Record<string, unknown>;
	/** Data fields (for create/update) */
	[key: string]: unknown;
}

// =============================================================================
// Transaction - Pipeline of operations
// =============================================================================

/** Named operation in a transaction */
export interface NamedOperation {
	/** Binding name for this operation's result */
	$as: string;
	/** The operation to execute */
	$do: EntityOperation;
}

/** Transaction - ordered list of operations with dependencies */
export interface Transaction {
	/** Pipeline of operations */
	$tx: NamedOperation[];
	/** What to return from the transaction */
	$return?: Record<string, unknown>;
	/** Side effects to trigger */
	$effects?: Effect[];
}

/** Side effect */
export interface Effect {
	/** Invalidate cache keys */
	$invalidate?: string[];
	/** Broadcast event */
	$broadcast?: string;
	/** Event data */
	$data?: unknown;
}

// =============================================================================
// Multi-Entity DSL - Simplified format (current Lens format)
// =============================================================================

/** Multi-entity DSL - named operations map */
export interface MultiEntityDSL {
	[operationName: string]: EntityOperation;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isRefInput(v: unknown): v is RefInput {
	return typeof v === "object" && v !== null && "$input" in v;
}

export function isRefBinding(v: unknown): v is RefBinding {
	return typeof v === "object" && v !== null && "$ref" in v;
}

export function isRefNow(v: unknown): v is RefNow {
	return typeof v === "object" && v !== null && "$now" in v;
}

export function isRefTemp(v: unknown): v is RefTemp {
	return typeof v === "object" && v !== null && "$temp" in v;
}

export function isValueRef(v: unknown): v is ValueRef {
	return isRefInput(v) || isRefBinding(v) || isRefNow(v) || isRefTemp(v);
}

export function isOperator(v: unknown): v is Operator {
	if (typeof v !== "object" || v === null) return false;
	return (
		"$increment" in v ||
		"$decrement" in v ||
		"$push" in v ||
		"$pull" in v ||
		"$addToSet" in v ||
		"$default" in v ||
		"$if" in v
	);
}

export function isEntityOperation(v: unknown): v is EntityOperation {
	return typeof v === "object" && v !== null && "$entity" in v && "$op" in v;
}

export function isOpTypeConditional(v: unknown): v is OpTypeConditional {
	return typeof v === "object" && v !== null && "$if" in v;
}

export function isTransaction(v: unknown): v is Transaction {
	return typeof v === "object" && v !== null && "$tx" in v && Array.isArray((v as Transaction).$tx);
}

export function isMultiEntityDSL(v: unknown): v is MultiEntityDSL {
	if (typeof v !== "object" || v === null) return false;
	// Must have at least one EntityOperation
	return Object.values(v).some(isEntityOperation);
}
