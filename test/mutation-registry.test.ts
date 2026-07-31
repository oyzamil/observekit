import { afterEach, describe, expect, it, vi } from "vitest";

import { observekit } from "../src/index";

/** Sleeps one tick to let a mutation batch flush and dispatch. */
function flush() {
	return new Promise((r) => setTimeout(r, 0));
}

/**
 * Test suite for the shared-observer multiplexing internals: a single
 * native `MutationObserver` per root serving many watchers, batched
 * single-callback dispatch for simultaneous DOM changes, and
 * JS-side `matches()` scoping instead of per-selector `querySelectorAll`.
 */
describe("shared observer multiplexing", () => {
	/** Disposers collected per-test, disconnected in `afterEach`. */
	const disposers: Array<{ disconnect(): void }> = [];
	afterEach(async () => {
		disposers.splice(0).forEach((d) => d.disconnect());
		document.body.innerHTML = "";
		await flush();
	});

	/**
	 * Verifies that registering `element`, `selector`, `attribute`, and
	 * `children` watchers against the same root results in only one
	 * native `MutationObserver` instance being constructed.
	 */
	it("uses a single native MutationObserver for multiple selector/element/attribute/children/text watchers on the same root", async () => {
		const OriginalMutationObserver = globalThis.MutationObserver;
		let instanceCount = 0;

		/** Counts every real `MutationObserver` construction. */
		class CountingMutationObserver extends OriginalMutationObserver {
			constructor(cb: MutationCallback) {
				super(cb);
				instanceCount++;
			}
		}
		globalThis.MutationObserver =
			CountingMutationObserver as unknown as typeof MutationObserver;

		const target = document.createElement("div");
		target.id = "shared-target";
		document.body.appendChild(target);

		const cb1 = vi.fn();
		const cb2 = vi.fn();
		const cb3 = vi.fn();
		const cb4 = vi.fn();

		disposers.push(observekit.element(".a", cb1, { existing: false }));
		disposers.push(observekit.selector(".b", cb2, { existing: false }));
		disposers.push(observekit.attribute(target, ["data-x"], cb3));
		disposers.push(observekit.children(target, cb4));

		// Only one native MutationObserver constructed for document root,
		// regardless of how many watchers were registered against it.
		expect(instanceCount).toBe(1);

		globalThis.MutationObserver = OriginalMutationObserver;
	});

	/**
	 * Verifies N simultaneous DOM insertions delivered in a single
	 * native mutation record batch result in exactly one callback
	 * invocation carrying all N matched elements.
	 */
	it("dispatches a single callback invocation for N simultaneous DOM changes (batch dispatch)", async () => {
		const cb = vi.fn();
		disposers.push(observekit.element(".item", cb, { existing: false }));

		const frag = document.createDocumentFragment();
		for (let i = 0; i < 5; i++) {
			const el = document.createElement("div");
			el.className = "item";
			frag.appendChild(el);
		}
		document.body.appendChild(frag);

		await flush();

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toHaveLength(5);
	});

	/**
	 * Verifies selector matching for an added subtree is done via a
	 * single `querySelectorAll` walk plus per-selector `matches()`
	 * checks, rather than one `querySelectorAll` call per registered
	 * selector.
	 */
	it("scopes selector matching to the JS-side matches() walk without extra querySelectorAll per selector", async () => {
		const qsaSpy = vi.spyOn(Element.prototype, "querySelectorAll");
		const matchesSpy = vi.spyOn(Element.prototype, "matches");

		const cbA = vi.fn();
		const cbB = vi.fn();
		const cbC = vi.fn();
		disposers.push(observekit.element(".x", cbA, { existing: false }));
		disposers.push(observekit.element(".y", cbB, { existing: false }));
		disposers.push(observekit.element(".z", cbC, { existing: false }));

		qsaSpy.mockClear();
		matchesSpy.mockClear();

		const el = document.createElement("div");
		el.className = "x";
		document.body.appendChild(el);
		await flush();

		// One querySelectorAll call for the subtree walk of the single added
		// node (descendant scan), not one per registered selector (3).
		expect(qsaSpy.mock.calls.length).toBeLessThan(3);
		// matches() is used for the per-selector test.
		expect(matchesSpy).toHaveBeenCalled();

		qsaSpy.mockRestore();
		matchesSpy.mockRestore();
	});
});
