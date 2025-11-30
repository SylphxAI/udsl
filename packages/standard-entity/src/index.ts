/**
 * Standard Entity Protocol
 *
 * A cross-library interface for type-safe entity operations.
 * Similar to Standard Schema - structural typing without direct imports.
 *
 * ## For Library Authors (Implementers)
 *
 * Add the `~entity` marker to your entity definitions:
 *
 * ```typescript
 * // Your library's entity definition
 * interface MyEntity<Name extends string, Fields> {
 *   readonly "~entity": {
 *     readonly name: Name;
 *     readonly type: unknown;  // or inferred type
 *   };
 *   readonly fields: Fields;
 * }
 * ```
 *
 * ## For Library Consumers
 *
 * Accept `StandardEntity` in your APIs:
 *
 * ```typescript
 * function createEntity<T extends StandardEntity>(
 *   entity: T,
 *   data: InferEntityData<T>
 * ) { ... }
 * ```
 *
 * ## Example Integration
 *
 * ```typescript
 * // Lens defines entities
 * const User = entity("User", {
 *   id: t.id(),
 *   name: t.string(),
 * });
 *
 * // Reify accepts them with full type inference
 * e.create(User, {
 *   id: temp(),     // ✅ typed as string | RefTemp
 *   name: "Alice",  // ✅ typed as string
 * });
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Standard Entity Protocol
// =============================================================================

/**
 * Standard Entity Protocol Interface
 *
 * Any library can implement this interface to enable type-safe entity operations.
 * Uses structural typing - no import required, just match the shape.
 *
 * @typeParam TName - Entity name (string literal type)
 * @typeParam TData - Entity data type (can be unknown if using fields-based inference)
 *
 * @example
 * ```typescript
 * // Implementing the protocol
 * interface MyEntityDef<Name extends string, Fields> extends StandardEntity<Name> {
 *   readonly fields: Fields;
 * }
 * ```
 */
export interface StandardEntity<TName extends string = string, TData = unknown> {
	/**
	 * Standard Entity marker with phantom types.
	 * The `~` prefix is a convention indicating this is a protocol marker.
	 */
	readonly "~entity": {
		/** Entity name as a string literal type */
		readonly name: TName;
		/**
		 * Entity data type.
		 * Can be `unknown` if type is inferred from `fields` property.
		 */
		readonly type: TData;
	};
	/**
	 * Optional fields for type inference.
	 * Libraries like Lens use this for field-based type inference.
	 */
	readonly fields?: unknown;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value implements the StandardEntity protocol.
 *
 * @example
 * ```typescript
 * if (isStandardEntity(value)) {
 *   console.log(value["~entity"].name);
 * }
 * ```
 */
export function isStandardEntity(value: unknown): value is StandardEntity {
	return (
		typeof value === "object" &&
		value !== null &&
		"~entity" in value &&
		typeof (value as StandardEntity)["~entity"] === "object" &&
		(value as StandardEntity)["~entity"] !== null &&
		"name" in (value as StandardEntity)["~entity"]
	);
}

// =============================================================================
// Type Inference Helpers
// =============================================================================

/**
 * Extract entity name from StandardEntity.
 *
 * @example
 * ```typescript
 * type Name = InferEntityName<typeof User>;  // "User"
 * ```
 */
export type InferEntityName<T> = T extends StandardEntity<infer N, unknown> ? N : never;

/**
 * Extract entity data type from StandardEntity.
 * Returns the `type` from `~entity` marker.
 *
 * Note: For field-based inference (like Lens), consumers should implement
 * their own inference logic based on the `fields` property.
 *
 * @example
 * ```typescript
 * type Data = InferEntityType<typeof User>;  // { id: string; name: string; }
 * ```
 */
export type InferEntityType<T> = T extends StandardEntity<string, infer D> ? D : never;

// =============================================================================
// Utility Types for Implementers
// =============================================================================

/**
 * Helper type for creating StandardEntity-compatible definitions.
 * Use this when building your own entity system.
 *
 * @example
 * ```typescript
 * interface MyEntity<N extends string, D> extends EntityMarker<N, D> {
 *   // your additional properties
 * }
 * ```
 */
export interface EntityMarker<TName extends string, TData = unknown> {
	readonly "~entity": {
		readonly name: TName;
		readonly type: TData;
	};
}

/**
 * Minimal StandardEntity implementation.
 * Useful for simple entity definitions without field inference.
 *
 * @example
 * ```typescript
 * const User: SimpleEntity<"User", UserData> = {
 *   "~entity": { name: "User", type: undefined as unknown as UserData }
 * };
 * ```
 */
export type SimpleEntity<TName extends string, TData> = EntityMarker<TName, TData>;
