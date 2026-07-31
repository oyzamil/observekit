import { describe, expect, it } from "vitest";

import { observekit } from "../src/index";

describe("feature detection / graceful no-op fallback", () => {
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

	it("observekit.reports no-ops without throwing when ReportingObserver is unsupported", () => {
		expect(() => {
			const d = observekit.reports(["deprecation"], () => {});
			d.disconnect();
		}).not.toThrow();
	});

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
