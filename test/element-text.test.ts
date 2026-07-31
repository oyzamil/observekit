import { describe, expect, it } from "vitest";

import { element } from "../src/element";

describe("element() text matching", () => {
	it("matches added elements by exact normalized text", async () => {
		document.body.innerHTML = "";
		const seen: Element[] = [];
		element("button", (els) => seen.push(...els), { text: "Archive" });

		const btn = document.createElement("button");
		btn.textContent = "  Archive\n  ";
		document.body.appendChild(btn);
		await new Promise((r) => setTimeout(r, 0));

		expect(seen).toEqual([btn]);
	});

	it("ignores elements whose text does not match", async () => {
		document.body.innerHTML = "";
		const seen: Element[] = [];
		element("button", (els) => seen.push(...els), { text: "Archive" });

		const btn = document.createElement("button");
		btn.textContent = "Delete";
		document.body.appendChild(btn);
		await new Promise((r) => setTimeout(r, 0));

		expect(seen).toEqual([]);
	});

	it("supports RegExp and predicate matchers", async () => {
		document.body.innerHTML = "";
		const seenRegex: Element[] = [];
		const seenFn: Element[] = [];
		element("span", (els) => seenRegex.push(...els), { text: /^Archive/ });
		element("span", (els) => seenFn.push(...els), {
			text: (t) => t.startsWith("Arch"),
		});

		const span = document.createElement("span");
		span.textContent = "Archived 3 items";
		document.body.appendChild(span);
		await new Promise((r) => setTimeout(r, 0));

		expect(seenRegex).toEqual([span]);
		expect(seenFn).toEqual([span]);
	});

	it("does not double-fire for a matching leaf and its matching ancestor", async () => {
		document.body.innerHTML = "";
		const seen: Element[] = [];
		// Scoped to 'button' only — the wrapping div also contains "Archive"
		// in its textContent but isn't a <button>, so it's never a candidate.
		element("button", (els) => seen.push(...els), { text: "Archive" });

		const wrapper = document.createElement("div");
		wrapper.innerHTML = "<button>Archive</button>";
		document.body.appendChild(wrapper);
		await new Promise((r) => setTimeout(r, 0));

		expect(seen.length).toBe(1);
	});

	it("matches pre-existing elements on registration", () => {
		document.body.innerHTML = '<button>Archive</button>';
		const seen: Element[] = [];
		element("button", (els) => seen.push(...els), { text: "Archive" });
		expect(seen.length).toBe(1);
	});

	it("fires onRemove based on prior match, not re-derived text", async () => {
		document.body.innerHTML = "";
		const removed: Element[] = [];
		element(
			"button",
			{ add: () => {}, remove: (els) => removed.push(...els) },
			{ text: "Archive" },
		);

		const btn = document.createElement("button");
		btn.textContent = "Archive";
		document.body.appendChild(btn);
		await new Promise((r) => setTimeout(r, 0));

		document.body.removeChild(btn);
		await new Promise((r) => setTimeout(r, 0));

		expect(removed).toEqual([btn]);
	});
});
