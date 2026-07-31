import { describe, expect, it } from "vitest";

import { observekit } from "../src/index";

/**
 * Test suite for graceful degradation when browser observer APIs
 * (PerformanceObserver, ReportingObserver) are unsupported, and for
 * the disposer contract shared across all `observekit.*` methods.
 */
describe("feature detection / graceful no-op fallback", () => {
	/**
	 * Verifies `observekit.performance` does not throw and returns a
	 * usable disposer when `PerformanceObserver` is absent from the
	 * global scope (simulated unsupported environment).
	 */
	it("observekit.performance no-ops without throwing when PerformanceObserver is unsupported", () => {
		const original = globalThis.PerformanceObserver;
		// @ts-expect-error - simulate unsupported environment
		delete globalThis.PerformanceObserver;

		expect(() => {
			const d = observekit.performance(["navigation"], () => {});
			d.disconnect();
		}).not.toThrow();

		globalThis.PerformanceObserver = original;
	});

	/**
	 * Verifies `observekit.reports` does not throw and returns a usable
	 * disposer when `ReportingObserver` is unsupported in the environment.
	 */
	it("observekit.reports no-ops without throwing when ReportingObserver is unsupported", () => {
		expect(() => {
			const d = observekit.reports(["deprecation"], () => {});
			d.disconnect();
		}).not.toThrow();
	});

	/**
	 * Verifies every `observekit.*` factory (element, attribute,
	 * children, text, performance, reports) returns a disposer object
	 * exposing a callable `disconnect()` method.
	 */
	it("every observekit.* call returns a disposer with disconnect()", () => {
		const el = document.createElement("div");
		document.body.appendChild(el);

		const disposers = [
			observekit.element(".x", () => {}, { existing: false }),
			observekit.attribute(el, ["id"], () => {}),
			observekit.children(el, () => {}),
			observekit.text(el, () => {}),
			observekit.performance(["navigation"], () => {}),
			observekit.reports(["deprecation"], () => {}),
		];

		disposers.forEach((d) => expect(typeof d.disconnect).toBe("function"));
		disposers.forEach((d) => d.disconnect());
		document.body.innerHTML = "";
	});
});
