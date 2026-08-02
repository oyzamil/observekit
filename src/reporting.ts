import type { BaseOptions, Disposer } from "./types";

import { createBatcher, createLifecycle } from "./util";

// ReportingObserver isn't in all lib.dom.d.ts versions - keep a minimal local shape.

/** Minimal shape of `ReportingObserver`'s constructor options. */
interface ReportingObserverOptions {
	types?: string[];
	buffered?: boolean;
}

/** A single report delivered by `ReportingObserver` (deprecation, intervention, crash, etc.). */
export interface Report {
	type: string;
	url: string;
	body: unknown;
}

/** Minimal local declaration of the `ReportingObserver` constructor, since it's not in every `lib.dom.d.ts`. */
declare class ReportingObserverCtor {
	constructor(
		callback: (reports: Report[]) => void,
		options?: ReportingObserverOptions,
	);
	observe(): void;
	disconnect(): void;
}

/**
 * Wraps ReportingObserver (deprecation / intervention / crash reports).
 * Feature-detected: no-ops on browsers without support instead of throwing.
 *
 * @param types - Report types to observe (e.g. `["deprecation", "crash"]`).
 * @param callback - Invoked with each batch of reports.
 * @param options - Shared watcher options (debounce, once, timeout, etc.).
 * @returns A `Disposer`; call `.disconnect()` to stop observing. Resolves
 * to a no-op disposer in environments without `ReportingObserver`.
 */
export function reports(
	types: string[],
	callback: (reports: Report[]) => void,
	options: BaseOptions = {},
): Disposer {
	const Ctor = (
		globalThis as { ReportingObserver?: typeof ReportingObserverCtor }
	).ReportingObserver;
	if (!Ctor) {
		return { disconnect() {} };
	}

	const batcher = createBatcher<Report>((items) => {
		callback(items);
		lifecycle.markFired();
	}, options.debounce);

	const observer = new Ctor((list) => batcher.push(list), {
		types,
		buffered: true,
	});
	const lifecycle = createLifecycle(options, () => observer.disconnect());

	observer.observe();

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}
