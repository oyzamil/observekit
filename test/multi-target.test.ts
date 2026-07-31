import { afterEach, describe, expect, it, vi } from "vitest";

import { observekit } from "../src/index";

/**
 * Test suite verifying multi-target registrations (`resize`, `visible`)
 * construct exactly one native observer instance (O(1)) while calling
 * `observe()` once per target (O(n)) — i.e. no per-target observer cost.
 */
describe("multi-target registration cost", () => {
	/** Disposers collected per-test, disconnected in `afterEach`. */
	const disposers: Array<{ disconnect(): void }> = [];
	afterEach(() => {
		disposers.splice(0).forEach((d) => d.disconnect());
	});

	/**
	 * Verifies `observekit.resize([el1, el2, el3], cb)` constructs a
	 * single `ResizeObserver` and calls `observe()` once per element.
	 */
	it("observekit.resize([el1, el2, el3], cb) creates one ResizeObserver and calls observe() n times", () => {
		const observeSpy = vi.fn();
		const disconnectSpy = vi.fn();
		let ctorCalls = 0;

		/** Fake `ResizeObserver` that records constructor/observe/disconnect calls. */
		class FakeResizeObserver {
			constructor(_cb: unknown) {
				ctorCalls++;
			}
			observe = observeSpy;
			disconnect = disconnectSpy;
			unobserve = vi.fn();
		}
		const original = globalThis.ResizeObserver;
		globalThis.ResizeObserver =
			FakeResizeObserver as unknown as typeof ResizeObserver;

		const els = [
			document.createElement("div"),
			document.createElement("div"),
			document.createElement("div"),
		];
		const d = observekit.resize(els, () => {});
		disposers.push(d);

		expect(ctorCalls).toBe(1); // O(1) native observer
		expect(observeSpy).toHaveBeenCalledTimes(3); // O(n) observe() calls

		globalThis.ResizeObserver = original;
	});

	/**
	 * Verifies `observekit.visible([...])` constructs a single
	 * `IntersectionObserver` regardless of how many targets are passed.
	 */
	it("observekit.visible([...]) creates one IntersectionObserver regardless of target count", () => {
		const observeSpy = vi.fn();
		let ctorCalls = 0;

		/** Fake `IntersectionObserver` that records constructor/observe calls. */
		class FakeIntersectionObserver {
			constructor(_cb: unknown, _opts: unknown) {
				ctorCalls++;
			}
			observe = observeSpy;
			disconnect = vi.fn();
			unobserve = vi.fn();
		}
		const original = globalThis.IntersectionObserver;
		// @ts-expect-error - stubbing global for the test
		globalThis.IntersectionObserver = FakeIntersectionObserver;

		const els = Array.from({ length: 5 }, () => document.createElement("div"));
		const d = observekit.visible(els, () => {});
		disposers.push(d);

		expect(ctorCalls).toBe(1);
		expect(observeSpy).toHaveBeenCalledTimes(5);

		globalThis.IntersectionObserver = original;
	});
});
