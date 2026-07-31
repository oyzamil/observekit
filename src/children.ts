import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { registerTargetWatcher } from "./mutation-registry";
import { createBatcher, createLifecycle, toArray } from "./util";

/**
 * Watches one or more specific elements for direct child list changes
 * (elements added to or removed from the target), firing `callback` with
 * the affected child element(s).
 *
 * @param targets - A single element or array of elements to watch.
 * @param callback - Invoked with the batch of added/removed child elements.
 * @param options - Shared watcher options (debounce, once, timeout, etc.).
 * @returns A `Disposer`; call `.disconnect()` to stop watching.
 */
export function children(
	targets: Element | Element[],
	callback: ElementsCallback,
	options: BaseOptions = {},
): Disposer {
	const list = toArray(targets);
	const batcher = createBatcher<Element>((items) => {
		callback(items);
		lifecycle.markFired();
	}, options.debounce);

	const lifecycle = createLifecycle(options, () =>
		unregisterAll.forEach((fn) => fn()),
	);

	const unregisterAll = list.map((target) =>
		registerTargetWatcher(target.ownerDocument ?? document, target, {
			kind: "children",
			onFire: (els) => batcher.push(els),
		}),
	);

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}
