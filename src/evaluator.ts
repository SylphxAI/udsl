/**
 * UDSL - Generic Evaluator
 *
 * Language-agnostic evaluator for UDSL expressions.
 * Can be extended with custom handlers for different runtimes.
 */

import {
	type EntityOperation,
	type MultiEntityDSL,
	type OpTypeConditional,
	isOpTypeConditional,
	isRefBinding,
	isRefInput,
	isRefNow,
	isRefTemp,
} from "./types";

// =============================================================================
// Evaluation Context
// =============================================================================

/** Context for evaluating DSL expressions */
export interface EvaluationContext {
	/** Input data (from $input references) */
	input: Record<string, unknown>;
	/** Bindings from previous operations (from $ref references) */
	bindings?: Record<string, unknown>;
	/** Current timestamp (for $now) */
	now?: Date;
	/** Temp ID generator (for $temp) */
	generateTempId?: () => string;
}

/** Result of evaluating a single operation */
export interface EvaluatedOperation {
	/** Operation name/key */
	name: string;
	/** Target entity type */
	entity: string;
	/** Operation type (create/update/delete/upsert) */
	op: "create" | "update" | "delete" | "upsert";
	/** Entity ID (for update/delete) */
	id?: string;
	/** Entity IDs (for bulk operations) */
	ids?: string[];
	/** Where clause (for bulk operations) */
	where?: Record<string, unknown>;
	/** Data to apply */
	data: Record<string, unknown>;
}

// =============================================================================
// Value Resolution
// =============================================================================

let tempIdCounter = 0;

/** Reset temp ID counter (for testing) */
export function resetTempIdCounter(): void {
	tempIdCounter = 0;
}

/**
 * Resolve a value, expanding any DSL references
 */
export function resolveValue(value: unknown, ctx: EvaluationContext): unknown {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return value;
	}

	// Handle $input reference
	if (isRefInput(value)) {
		return getNestedValue(ctx.input, value.$input);
	}

	// Handle $ref reference
	if (isRefBinding(value)) {
		if (!ctx.bindings) {
			throw new EvaluationError(`Cannot resolve $ref: no bindings in context`);
		}
		return getNestedValue(ctx.bindings, value.$ref);
	}

	// Handle $now reference
	if (isRefNow(value)) {
		return ctx.now ?? new Date();
	}

	// Handle $temp reference
	if (isRefTemp(value)) {
		if (ctx.generateTempId) {
			return ctx.generateTempId();
		}
		return `temp_${++tempIdCounter}`;
	}

	// Handle operators
	if (typeof value === "object" && value !== null) {
		const obj = value as Record<string, unknown>;

		// $increment - return special marker
		if ("$increment" in obj) {
			return { $increment: obj.$increment };
		}

		// $decrement - return special marker
		if ("$decrement" in obj) {
			return { $decrement: obj.$decrement };
		}

		// $push - return special marker with resolved value
		if ("$push" in obj) {
			return { $push: resolveValue(obj.$push, ctx) };
		}

		// $pull - return special marker with resolved value
		if ("$pull" in obj) {
			return { $pull: resolveValue(obj.$pull, ctx) };
		}

		// $addToSet - return special marker with resolved value
		if ("$addToSet" in obj) {
			return { $addToSet: resolveValue(obj.$addToSet, ctx) };
		}

		// $default - use default if resolved value is undefined
		if ("$default" in obj) {
			return obj.$default;
		}

		// $if - conditional
		if ("$if" in obj) {
			const cond = obj.$if as { condition: unknown; then: unknown; else?: unknown };
			const conditionResult = resolveValue(cond.condition, ctx);
			if (isTruthy(conditionResult)) {
				return resolveValue(cond.then, ctx);
			}
			return cond.else !== undefined ? resolveValue(cond.else, ctx) : undefined;
		}

		// Handle arrays
		if (Array.isArray(value)) {
			return value.map((v) => resolveValue(v, ctx));
		}

		// Handle plain objects - recursively resolve
		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			result[k] = resolveValue(v, ctx);
		}
		return result;
	}

	// Primitive value - return as-is
	return value;
}

/**
 * Get nested value from object using dot-notation path
 */
function getNestedValue(obj: unknown, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = obj;

	for (const part of parts) {
		if (current === null || current === undefined) {
			return undefined;
		}
		if (typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}

/**
 * Check if value is truthy (DSL semantics)
 * - null/undefined → false
 * - empty array → false
 * - empty string → false
 * - 0 → false
 * - false → false
 * - everything else → true
 */
function isTruthy(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (value === false) return false;
	if (value === 0) return false;
	if (value === "") return false;
	if (Array.isArray(value) && value.length === 0) return false;
	return true;
}

// =============================================================================
// Operation Evaluation
// =============================================================================

/**
 * Evaluate a single EntityOperation
 */
export function evaluateOperation(
	name: string,
	operation: EntityOperation,
	ctx: EvaluationContext,
): EvaluatedOperation {
	// Resolve operation type (may be conditional)
	let opType: "create" | "update" | "delete" | "upsert";

	if (isOpTypeConditional(operation.$op)) {
		const cond = operation.$op as OpTypeConditional;
		const conditionResult = resolveValue(cond.$if.condition, ctx);
		opType = isTruthy(conditionResult) ? cond.$if.then : cond.$if.else;
	} else {
		opType = operation.$op;
	}

	// Build result
	const result: EvaluatedOperation = {
		name,
		entity: operation.$entity,
		op: opType,
		data: {},
	};

	// Resolve ID
	if (operation.$id !== undefined) {
		result.id = resolveValue(operation.$id, ctx) as string;
	}

	// Resolve IDs
	if (operation.$ids !== undefined) {
		result.ids = resolveValue(operation.$ids, ctx) as string[];
	}

	// Resolve where
	if (operation.$where !== undefined) {
		result.where = resolveValue(operation.$where, ctx) as Record<string, unknown>;
	}

	// Resolve data fields (everything except $ prefixed keys)
	for (const [key, value] of Object.entries(operation)) {
		if (key.startsWith("$")) continue;
		result.data[key] = resolveValue(value, ctx);
	}

	return result;
}

/**
 * Evaluate a MultiEntityDSL, returning evaluated operations in order
 */
export function evaluateMultiEntityDSL(
	dsl: MultiEntityDSL,
	ctx: EvaluationContext,
): EvaluatedOperation[] {
	const results: EvaluatedOperation[] = [];
	const bindings: Record<string, unknown> = { ...ctx.bindings };

	for (const [name, operation] of Object.entries(dsl)) {
		const evalCtx: EvaluationContext = {
			...ctx,
			bindings,
		};

		const evaluated = evaluateOperation(name, operation, evalCtx);
		results.push(evaluated);

		// Add result to bindings for subsequent operations
		// The binding value is the data + id (simulating what the operation would return)
		bindings[name] = {
			id: evaluated.id,
			...evaluated.data,
		};
	}

	return results;
}

// =============================================================================
// Errors
// =============================================================================

export class EvaluationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EvaluationError";
	}
}
