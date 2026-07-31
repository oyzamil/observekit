import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { registerTargetWatcher } from "./mutation-registry";
import { createBatcher, createLifecycle, toArray } from "./util";

/**
 * Watches one or more specific elements for changes to the given
 * attribute(s), firing `callback` with the affected element(s) whenever any
 * of them change.
 *
 * @param targets - A single element or array of elements to watch.
 * @param attrs - Attribute names to react to (e.g. `["class", "disabled"]`).
 * @param callback - Invoked with the batch of elements whose watched
 * attribute(s) changed.
 * @param options - Shared watcher options (debounce, once, timeout, etc.).
 * @returns A `Disposer`; call `.disconnect()` to stop watching.
 */
export function attribute(
	targets: Element | Element[],
	attrs: string[],
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
			kind: "attribute",
			attrs,
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
