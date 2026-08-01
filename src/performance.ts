import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { createBatcher, createLifecycle } from "./util";

/** Options for `performance_()`, layered on top of `PerformanceObserver` init options. */
export interface PerformanceOptions extends BaseOptions {
	/** Include performance entries recorded before this observer was created. Defaults to `true`. */
	buffered?: boolean;
}

/**
 * Wraps `PerformanceObserver`, batching `PerformanceEntry` records for the
 * given `entryTypes`.
 *
 * @param entryTypes - Entry types to observe (e.g. `["largest-contentful-paint"]`).
 * @param callback - Invoked with each batch of `PerformanceEntry` records.
 * @param options - `PerformanceOptions`, including `buffered`, plus the
 * shared base options.
 * @returns A `Disposer`; call `.disconnect()` to stop observing. Resolves
 * to a no-op disposer in environments without `PerformanceObserver`.
 */
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

	// PerformanceObserver.observe() rejects `buffered` when passed alongside
	// `entryTypes` (throws). `buffered` is only accepted with the single-type
	// `type` form, so only use it when there's exactly one entry type.
	if (entryTypes.length === 1) {
		observer.observe({
			type: entryTypes[0]!,
			buffered: options.buffered ?? true,
		});
	} else {
		observer.observe({ entryTypes });
	}

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}
