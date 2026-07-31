import type {
	Disposer,
	ElementCallback,
	ElementOptions,
	ElementsCallback,
} from "./types";

import { registerElementWatcher } from "./mutation-registry";
import { createBatcher, createLifecycle, matchesText } from "./util";

function normalizeCallback(cb: ElementCallback): {
	onAdd?: ElementsCallback;
	onRemove?: ElementsCallback;
} {
	if (typeof cb === "function") return { onAdd: cb };
	return { onAdd: cb.add, onRemove: cb.remove };
}

export function element(
	selector: string,
	callback: ElementCallback,
	options: ElementOptions = {},
): Disposer {
	const root = options.root ?? document;
	const { onAdd, onRemove } = normalizeCallback(callback);

	const lifecycle = createLifecycle(options, () => unregister());

	const addBatcher = createBatcher<Element>((items) => {
		onAdd?.(items);
		lifecycle.markFired();
	}, options.debounce);

	const removeBatcher = createBatcher<Element>((items) => {
		onRemove?.(items);
	}, options.debounce);

	const watcher = {
		selector,
		textMatcher: options.text,
		fireOnAttributesModification: options.fireOnAttributesModification ?? false,
		matched: new Set<Element>(),
		onAdd: onAdd ? (els: Element[]) => addBatcher.push(els) : undefined,
		onRemove: onRemove
			? (els: Element[]) => removeBatcher.push(els)
			: undefined,
	};

	const unregister = registerElementWatcher(root, watcher);

	const existing = options.existing ?? true;
	if (existing && !lifecycle.disconnected()) {
		const scanRoot = root as Element | Document;
		let preexisting = Array.from(scanRoot.querySelectorAll(selector));
		if (options.text) {
			const tm = options.text;
			preexisting = preexisting.filter((el) => matchesText(el, tm));
		}
		if (preexisting.length) {
			preexisting.forEach((el) => watcher.matched.add(el));
			onAdd?.(preexisting);
			lifecycle.markFired();
		}
	}

	return {
		disconnect() {
			addBatcher.clear();
			removeBatcher.clear();
			lifecycle.disconnect();
		},
	};
}

/** Sugar alias over `element`, arrive.js-style. */
export const selector = element;
