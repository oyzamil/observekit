import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { registerTargetWatcher } from "./mutation-registry";
import { createBatcher, createLifecycle, toArray } from "./util";

/**
 * Watches one or more specific elements for changes to their text content
 * (via `characterData` mutations on descendant text nodes), firing
 * `callback` with the target element(s) whose text changed.
 *
 * @param targets - A single element or array of elements to watch.
 * @param callback - Invoked with the batch of elements whose text changed.
 * @param options - Shared watcher options (debounce, once, timeout, etc.).
 * @returns A `Disposer`; call `.disconnect()` to stop watching.
 */
export function text(
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
			kind: "text",
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
