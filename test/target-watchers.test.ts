import { afterEach, describe, expect, it, vi } from "vitest";

import { observekit } from "../src/index";

function flush(ms = 0) {
	return new Promise((r) => setTimeout(r, ms));
}

describe("observekit.attribute / children / text", () => {
	const disposers: Array<{ disconnect(): void }> = [];
	afterEach(async () => {
		disposers.splice(0).forEach((d) => d.disconnect());
		document.body.innerHTML = "";
		await flush();
	});

	it("attribute() only fires for the specified attribute names", async () => {
		const el = document.createElement("div");
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(observekit.attribute(el, ["data-watched"], cb));

		el.setAttribute("data-ignored", "1");
		await flush();
		expect(cb).not.toHaveBeenCalled();

		el.setAttribute("data-watched", "1");
		await flush();
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual([el]);
	});

	it("children() fires with added/removed direct children of the target", async () => {
		const parent = document.createElement("ul");
		document.body.appendChild(parent);

		const cb = vi.fn();
		disposers.push(observekit.children(parent, cb));

		const li = document.createElement("li");
		parent.appendChild(li);
		await flush();

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual([li]);
	});

	it("text() fires when descendant text content changes", async () => {
		const el = document.createElement("p");
		el.textContent = "hello";
		document.body.appendChild(el);

		const cb = vi.fn();
		disposers.push(observekit.text(el, cb));

		el.firstChild!.textContent = "world";
		await flush();

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual([el]);
	});

	it("supports multiple targets sharing one watcher registration", async () => {
		const a = document.createElement("div");
		const b = document.createElement("div");
		document.body.append(a, b);

		const cb = vi.fn();
		disposers.push(observekit.attribute([a, b], ["data-x"], cb));

		a.setAttribute("data-x", "1");
		b.setAttribute("data-x", "2");
		await flush();

		// one native mutation batch -> one delivered callback
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb.mock.calls[0]![0]).toEqual(expect.arrayContaining([a, b]));
	});
});
