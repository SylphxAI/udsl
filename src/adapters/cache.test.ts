import { beforeEach, describe, expect, it } from "bun:test";
import { entity, inc, pipe, push, ref, temp } from "../builder";
import { clearPlugins, execute, registerPlugin, resetTempIdCounter } from "../evaluator";
import { createCachePlugin, type CacheLike } from "./cache";

describe("Cache Adapter", () => {
	let cache: Map<string, unknown>;

	beforeEach(() => {
		cache = new Map();
		resetTempIdCounter();
		clearPlugins();
		registerPlugin(createCachePlugin(cache as CacheLike));
	});

	describe("entity.create", () => {
		it("creates entity in cache", async () => {
			const dsl = pipe(({ input }) => [
				entity.create("User", { name: input.name }).as("user"),
			]);

			const result = await execute(dsl, { name: "John" });

			expect(result.result.user).toMatchObject({ name: "John" });
			expect(cache.has("User:temp_1")).toBe(true);
			expect(cache.get("User:temp_1")).toMatchObject({ id: "temp_1", name: "John" });
		});

		it("uses provided id", async () => {
			const dsl = pipe(({ input }) => [
				entity.create("User", { id: input.userId, name: input.name }).as("user"),
			]);

			const result = await execute(dsl, { userId: "user_123", name: "Jane" });

			expect(result.result.user).toMatchObject({ id: "user_123", name: "Jane" });
			expect(cache.get("User:user_123")).toMatchObject({ id: "user_123", name: "Jane" });
		});

		it("uses temp() for id", async () => {
			const dsl = pipe(({ input }) => [
				entity.create("User", { id: temp(), name: input.name }).as("user"),
			]);

			const result = await execute(dsl, { name: "Bob" });

			expect(result.result.user).toMatchObject({ id: "temp_1", name: "Bob" });
		});
	});

	describe("entity.update", () => {
		it("updates existing entity", async () => {
			cache.set("User:user_123", { id: "user_123", name: "John", age: 30 });

			const dsl = pipe(({ input }) => [
				entity.update("User", { id: input.userId, name: input.name }).as("user"),
			]);

			const result = await execute(dsl, { userId: "user_123", name: "Jane" });

			expect(result.result.user).toMatchObject({ id: "user_123", name: "Jane", age: 30 });
		});

		it("applies $inc operator", async () => {
			cache.set("User:user_123", { id: "user_123", count: 5 });

			const dsl = pipe(({ input }) => [
				entity.update("User", { id: input.userId, count: inc(1) }).as("user"),
			]);

			const result = await execute(dsl, { userId: "user_123" });

			expect(result.result.user).toMatchObject({ count: 6 });
		});

		it("applies $push operator", async () => {
			cache.set("User:user_123", { id: "user_123", tags: ["a"] });

			const dsl = pipe(({ input }) => [
				entity.update("User", { id: input.userId, tags: push("b") }).as("user"),
			]);

			const result = await execute(dsl, { userId: "user_123" });

			expect(result.result.user).toMatchObject({ tags: ["a", "b"] });
		});
	});

	describe("entity.delete", () => {
		it("deletes entity from cache", async () => {
			cache.set("User:user_123", { id: "user_123", name: "John" });

			const dsl = pipe(({ input }) => [
				entity.delete("User", input.userId).as("deleted"),
			]);

			await execute(dsl, { userId: "user_123" });

			expect(cache.has("User:user_123")).toBe(false);
		});
	});

	describe("pipeline with refs", () => {
		it("creates related entities", async () => {
			const dsl = pipe(({ input }) => [
				entity.create("Session", { id: temp(), title: input.title }).as("session"),
				entity.create("Message", { id: temp(), sessionId: ref("session").id, content: input.content }).as("message"),
			]);

			const result = await execute(dsl, { title: "Chat", content: "Hello" });

			expect(result.result.session).toMatchObject({ id: "temp_1", title: "Chat" });
			expect(result.result.message).toMatchObject({ sessionId: "temp_1", content: "Hello" });
			expect(cache.get("Session:temp_1")).toMatchObject({ title: "Chat" });
			expect(cache.get("Message:temp_2")).toMatchObject({ sessionId: "temp_1" });
		});
	});
});
