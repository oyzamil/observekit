import { afterEach, describe, expect, it, vi } from "vitest";

import { observekit } from "../src/index";

function flush(ms = 0) {
	return new Promise((r) => setTimeout(r, ms));
}

describe("observekit.element / selector", () => {
	const disposers: Array<{ disconnect(): void }> = [];
	afterEach(async () => {
		disposers.splice(0).forEach((d) => d.disconnect());
		document.body.innerHTML = "";
		await flush();
	});

	it("existing: true (default) fires immediately for elements already in the DOM", async () => {
		const el = document.createElement("div");
		el.className = "pre-existing";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(observekit.element(".pre-existing", cb));

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual([el]);
	});

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
