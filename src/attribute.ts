import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { registerTargetWatcher } from "./mutation-registry";
import { createBatcher, createLifecycle, toArray } from "./util";

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
