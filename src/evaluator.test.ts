import { describe, expect, it, beforeEach } from "bun:test";
import { op, pipeline, ref, when } from "./builder";
import {
	evaluateMultiEntityDSL,
	evaluateOperation,
	resolveValue,
	resetTempIdCounter,
} from "./evaluator";
import type { EntityOperation, EvaluationContext } from "./index";

describe("UDSL Evaluator", () => {
	beforeEach(() => {
		resetTempIdCounter();
	});

	describe("resolveValue", () => {
		it("resolves $input references", () => {
			const ctx: EvaluationContext = {
				input: { name: "John", nested: { value: 42 } },
			};

			expect(resolveValue({ $input: "name" }, ctx)).toBe("John");
			expect(resolveValue({ $input: "nested.value" }, ctx)).toBe(42);
			expect(resolveValue({ $input: "missing" }, ctx)).toBeUndefined();
		});

		it("resolves $ref references", () => {
			const ctx: EvaluationContext = {
				input: {},
				bindings: { session: { id: "sess_123", title: "Test" } },
			};

			expect(resolveValue({ $ref: "session.id" }, ctx)).toBe("sess_123");
			expect(resolveValue({ $ref: "session.title" }, ctx)).toBe("Test");
		});

		it("resolves $now reference", () => {
			const now = new Date("2024-01-01");
			const ctx: EvaluationContext = { input: {}, now };

			expect(resolveValue({ $now: true }, ctx)).toEqual(now);
		});

		it("resolves $temp reference", () => {
			const ctx: EvaluationContext = { input: {} };

			expect(resolveValue({ $temp: true }, ctx)).toBe("temp_1");
			expect(resolveValue({ $temp: true }, ctx)).toBe("temp_2");
		});

		it("resolves $temp with custom generator", () => {
			let counter = 0;
			const ctx: EvaluationContext = {
				input: {},
				generateTempId: () => `custom_${++counter}`,
			};

			expect(resolveValue({ $temp: true }, ctx)).toBe("custom_1");
			expect(resolveValue({ $temp: true }, ctx)).toBe("custom_2");
		});

		it("preserves operators", () => {
			const ctx: EvaluationContext = { input: {} };

			expect(resolveValue({ $increment: 1 }, ctx)).toEqual({ $increment: 1 });
			expect(resolveValue({ $decrement: 5 }, ctx)).toEqual({ $decrement: 5 });
			expect(resolveValue({ $push: "item" }, ctx)).toEqual({ $push: "item" });
			expect(resolveValue({ $pull: "item" }, ctx)).toEqual({ $pull: "item" });
			expect(resolveValue({ $addToSet: "item" }, ctx)).toEqual({ $addToSet: "item" });
		});

		it("resolves $if conditionals", () => {
			const ctx: EvaluationContext = {
				input: { isAdmin: true, role: "admin" },
			};

			expect(
				resolveValue(
					{
						$if: {
							condition: { $input: "isAdmin" },
							then: "admin",
							else: "user",
						},
					},
					ctx,
				),
			).toBe("admin");

			ctx.input.isAdmin = false;
			expect(
				resolveValue(
					{
						$if: {
							condition: { $input: "isAdmin" },
							then: "admin",
							else: "user",
						},
					},
					ctx,
				),
			).toBe("user");
		});

		it("resolves nested objects", () => {
			const ctx: EvaluationContext = {
				input: { name: "John", age: 30 },
			};

			expect(
				resolveValue(
					{
						user: { $input: "name" },
						info: { age: { $input: "age" } },
					},
					ctx,
				),
			).toEqual({
				user: "John",
				info: { age: 30 },
			});
		});

		it("resolves arrays", () => {
			const ctx: EvaluationContext = {
				input: { a: 1, b: 2 },
			};

			expect(resolveValue([{ $input: "a" }, { $input: "b" }, 3], ctx)).toEqual([1, 2, 3]);
		});

		it("handles truthy/falsy DSL semantics", () => {
			const ctx: EvaluationContext = { input: {} };
			const ifOp = (condition: unknown) => ({
				$if: { condition, then: "yes", else: "no" },
			});

			// Falsy values
			expect(resolveValue(ifOp(null), ctx)).toBe("no");
			expect(resolveValue(ifOp(undefined), ctx)).toBe("no");
			expect(resolveValue(ifOp(false), ctx)).toBe("no");
			expect(resolveValue(ifOp(0), ctx)).toBe("no");
			expect(resolveValue(ifOp(""), ctx)).toBe("no");
			expect(resolveValue(ifOp([]), ctx)).toBe("no");

			// Truthy values
			expect(resolveValue(ifOp(true), ctx)).toBe("yes");
			expect(resolveValue(ifOp(1), ctx)).toBe("yes");
			expect(resolveValue(ifOp("hello"), ctx)).toBe("yes");
			expect(resolveValue(ifOp([1]), ctx)).toBe("yes");
			expect(resolveValue(ifOp({}), ctx)).toBe("yes");
		});
	});

	describe("evaluateOperation", () => {
		it("evaluates create operation", () => {
			const operation: EntityOperation = {
				$entity: "User",
				$op: "create",
				name: { $input: "name" },
				email: { $input: "email" },
			};

			const ctx: EvaluationContext = {
				input: { name: "John", email: "john@example.com" },
			};

			const result = evaluateOperation("user", operation, ctx);

			expect(result).toEqual({
				name: "user",
				entity: "User",
				op: "create",
				data: { name: "John", email: "john@example.com" },
			});
		});

		it("evaluates update operation with id", () => {
			const operation: EntityOperation = {
				$entity: "User",
				$op: "update",
				$id: { $input: "userId" },
				name: { $input: "newName" },
			};

			const ctx: EvaluationContext = {
				input: { userId: "user_123", newName: "Jane" },
			};

			const result = evaluateOperation("user", operation, ctx);

			expect(result).toEqual({
				name: "user",
				entity: "User",
				op: "update",
				id: "user_123",
				data: { name: "Jane" },
			});
		});

		it("evaluates conditional $op", () => {
			const operation: EntityOperation = {
				$entity: "Session",
				$op: {
					$if: {
						condition: { $input: "sessionId" },
						then: "update",
						else: "create",
					},
				},
				$id: { $input: "sessionId" },
				title: { $input: "title" },
			};

			// When sessionId exists → update
			const ctxWithId: EvaluationContext = {
				input: { sessionId: "sess_123", title: "Test" },
			};
			expect(evaluateOperation("session", operation, ctxWithId).op).toBe("update");

			// When sessionId is null → create
			const ctxWithoutId: EvaluationContext = {
				input: { sessionId: null, title: "Test" },
			};
			expect(evaluateOperation("session", operation, ctxWithoutId).op).toBe("create");
		});
	});

	describe("evaluateMultiEntityDSL", () => {
		it("evaluates simple pipeline", () => {
			const dsl = pipeline(({ input }) => [
				op.create("Session", { title: input.title }).as("session"),
			]);

			const ctx: EvaluationContext = {
				input: { title: "My Session" },
			};

			const results = evaluateMultiEntityDSL(dsl, ctx);

			expect(results).toHaveLength(1);
			expect(results[0]).toEqual({
				name: "session",
				entity: "Session",
				op: "create",
				data: { title: "My Session" },
			});
		});

		it("evaluates pipeline with $ref dependencies", () => {
			const dsl = pipeline(({ input }) => [
				op.create("Session", { id: ref.temp(), title: input.title }).as("session"),
				op.create("Message", { sessionId: ref.from("session").id }).as("message"),
			]);

			const ctx: EvaluationContext = {
				input: { title: "Test" },
			};

			const results = evaluateMultiEntityDSL(dsl, ctx);

			expect(results).toHaveLength(2);
			expect(results[0]!.data.id).toBe("temp_1");
			expect(results[1]!.data.sessionId).toBe("temp_1");
		});

		it("evaluates conditional pipeline", () => {
			const dsl = pipeline(({ input }) => [
				when(input.sessionId)
					.then([op.update("Session", { id: input.sessionId, title: input.title }).as("session")])
					.else([op.create("Session", { title: input.title }).as("session")]),
			]);

			// With sessionId → update
			const ctxUpdate: EvaluationContext = {
				input: { sessionId: "sess_123", title: "Updated" },
			};
			const resultsUpdate = evaluateMultiEntityDSL(dsl, ctxUpdate);
			expect(resultsUpdate[0]!.op).toBe("update");
			expect(resultsUpdate[0]!.id).toBe("sess_123");

			// Without sessionId → create
			const ctxCreate: EvaluationContext = {
				input: { sessionId: null, title: "New" },
			};
			const resultsCreate = evaluateMultiEntityDSL(dsl, ctxCreate);
			expect(resultsCreate[0]!.op).toBe("create");
		});

		it("evaluates complex chat pattern", () => {
			const dsl = pipeline(({ input }) => [
				op
					.create("Session", {
						id: ref.temp(),
						title: input.title,
						createdAt: ref.now(),
					})
					.as("session"),
				op
					.create("Message", {
						id: ref.temp(),
						sessionId: ref.from("session").id,
						role: "user",
						content: input.content,
					})
					.as("message"),
			]);

			const now = new Date("2024-01-01");
			const ctx: EvaluationContext = {
				input: { title: "New Chat", content: "Hello!" },
				now,
			};

			const results = evaluateMultiEntityDSL(dsl, ctx);

			expect(results).toHaveLength(2);

			// Session should be created
			expect(results[0]).toEqual({
				name: "session",
				entity: "Session",
				op: "create",
				data: {
					id: "temp_1",
					title: "New Chat",
					createdAt: now,
				},
			});

			// Message should reference session
			expect(results[1]).toEqual({
				name: "message",
				entity: "Message",
				op: "create",
				data: {
					id: "temp_2",
					sessionId: "temp_1",
					role: "user",
					content: "Hello!",
				},
			});
		});
	});
});
