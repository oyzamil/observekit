import type { BaseOptions, Disposer } from "./types";

import { createBatcher, createLifecycle } from "./util";

// ReportingObserver isn't in all lib.dom.d.ts versions - keep a minimal local shape.
interface ReportingObserverOptions {
	types?: string[];
	buffered?: boolean;
}
interface Report {
	type: string;
	url: string;
	body: unknown;
}
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
