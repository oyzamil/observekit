import { afterEach, describe, expect, it, vi } from "vitest";

import { observekit } from "../src/index";

/** Sleeps for `ms` (default 0) to let mutation/microtask queues flush. */
function flush(ms = 0) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Test suite for `observekit.element` / `observekit.selector` watcher API.
 * Covers existing-scan behavior, add/remove callbacks, attribute
 * re-fire option, `once`, `debounce`, `signal` abort, and `timeout`.
 */
describe("observekit.element / selector", () => {
	/** Disposers collected per-test, disconnected in `afterEach`. */
	const disposers: Array<{ disconnect(): void }> = [];
	afterEach(async () => {
		disposers.splice(0).forEach((d) => d.disconnect());
		document.body.innerHTML = "";
		await flush();
	});

	/**
	 * Verifies `existing: true` (the default) fires immediately for
	 * elements already present in the DOM at registration time.
	 */
	it("existing: true (default) fires immediately for elements already in the DOM", async () => {
		const el = document.createElement("div");
		el.className = "pre-existing";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(observekit.element(".pre-existing", cb));

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual([el]);
	});

	/**
	 * Verifies `existing: false` suppresses the initial scan, so
	 * pre-existing matching elements are not reported.
	 */
	it("existing: false suppresses the initial scan", () => {
		const el = document.createElement("div");
		el.className = "pre-existing-2";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(
			observekit.element(".pre-existing-2", cb, { existing: false }),
		);

		expect(cb).not.toHaveBeenCalled();
	});

	/**
	 * Verifies the `{ add, remove }` callback form fires `add` for
	 * future insertions and `remove` for subsequent removals.
	 */
	it("fires add/remove callbacks for future insertions and removals", async () => {
		const onAdd = vi.fn();
		const onRemove = vi.fn();
		disposers.push(
			observekit.element(
				".dyn",
				{ add: onAdd, remove: onRemove },
				{ existing: false },
			),
		);

		const el = document.createElement("div");
		el.className = "dyn";
		document.body.appendChild(el);
		await flush();

		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onAdd.mock.calls[0]![0]).toEqual([el]);

		el.remove();
		await flush();

		expect(onRemove).toHaveBeenCalledTimes(1);
		expect(onRemove.mock.calls[0]![0]).toEqual([el]);
	});

	/**
	 * Verifies `fireOnAttributesModification: true` re-fires the add
	 * callback (in addition to the initial existing-scan fire) whenever
	 * a matched element's attributes change.
	 */
	it("fireOnAttributesModification re-fires add callback when a matched element changes attributes", async () => {
		const el = document.createElement("div");
		el.className = "watched";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(
			observekit.element(".watched", cb, {
				fireOnAttributesModification: true,
			}),
		);

		// initial existing-scan fire
		expect(cb).toHaveBeenCalledTimes(1);

		el.setAttribute("data-foo", "bar");
		await flush();

		expect(cb).toHaveBeenCalledTimes(2);
		expect(cb.mock.calls[1]![0]).toEqual([el]);
	});

	/**
	 * Verifies that without `fireOnAttributesModification`, attribute
	 * changes on an already-matched element do not re-fire the callback.
	 */
	it("without fireOnAttributesModification, attribute changes do not re-fire", async () => {
		const el = document.createElement("div");
		el.className = "watched-2";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(observekit.element(".watched-2", cb));
		expect(cb).toHaveBeenCalledTimes(1);

		el.setAttribute("data-foo", "bar");
		await flush();

		expect(cb).toHaveBeenCalledTimes(1);
	});

	/**
	 * Verifies `once: true` auto-disconnects the watcher after the
	 * first batch fires, so later matching insertions are ignored.
	 */
	it("once: true auto-disconnects after the first batch", async () => {
		const cb = vi.fn();
		disposers.push(
			observekit.element(".once-item", cb, { existing: false, once: true }),
		);

		const a = document.createElement("div");
		a.className = "once-item";
		document.body.appendChild(a);
		await flush();
		expect(cb).toHaveBeenCalledTimes(1);

		const b = document.createElement("div");
		b.className = "once-item";
		document.body.appendChild(b);
		await flush();

		// disconnected after first fire - second insertion should not trigger a 2nd call
		expect(cb).toHaveBeenCalledTimes(1);
	});

	/**
	 * Verifies the `debounce` option coalesces multiple rapid matches
	 * within the debounce window into a single batched callback call.
	 */
	it("debounce coalesces rapid fires into a single batched callback", async () => {
		const cb = vi.fn();
		disposers.push(
			observekit.element(".deb-item", cb, { existing: false, debounce: 20 }),
		);

		for (let i = 0; i < 3; i++) {
			const el = document.createElement("div");
			el.className = "deb-item";
			document.body.appendChild(el);
			await flush(); // separate microtask/mutation ticks, still within debounce window
		}

		expect(cb).not.toHaveBeenCalled();
		await flush(30);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toHaveLength(3);
	});

	/**
	 * Verifies passing an `AbortSignal` that is aborted disconnects the
	 * watcher, so subsequent matching insertions no longer fire.
	 */
	it("signal aborts and disconnects the watcher", async () => {
		const controller = new AbortController();
		const cb = vi.fn();
		disposers.push(
			observekit.element(".abort-item", cb, {
				existing: false,
				signal: controller.signal,
			}),
		);

		controller.abort();
		await flush();

		const el = document.createElement("div");
		el.className = "abort-item";
		document.body.appendChild(el);
		await flush();

		expect(cb).not.toHaveBeenCalled();
	});

	/**
	 * Verifies the `timeout` option auto-disconnects the watcher (and
	 * invokes `onDisconnect`) if nothing matches within the given time,
	 * after which further matching insertions are ignored.
	 */
	it("timeout auto-disconnects if nothing matches in time", async () => {
		const cb = vi.fn();
		const onDisconnect = vi.fn();
		disposers.push(
			observekit.element(".never", cb, {
				existing: false,
				timeout: 10,
				onDisconnect,
			}),
		);

		await flush(20);
		expect(onDisconnect).toHaveBeenCalledTimes(1);

		const el = document.createElement("div");
		el.className = "never";
		document.body.appendChild(el);
		await flush();
		expect(cb).not.toHaveBeenCalled();
	});
});
