import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { createBatcher, createLifecycle } from "./util";

export interface PerformanceOptions extends BaseOptions {
	buffered?: boolean;
}

export function performance_(
	entryTypes: string[],
	callback: ElementsCallback<PerformanceEntry>,
	options: PerformanceOptions = {},
): Disposer {
	if (typeof PerformanceObserver === "undefined") {
		return { disconnect() {} };
	}

	const batcher = createBatcher<PerformanceEntry>((entries) => {
		callback(entries);
		lifecycle.markFired();
	}, options.debounce);

	const observer = new PerformanceObserver((list) =>
		batcher.push(list.getEntries()),
	);
	const lifecycle = createLifecycle(options, () => observer.disconnect());

	observer.observe({ entryTypes, buffered: options.buffered ?? true });

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}
