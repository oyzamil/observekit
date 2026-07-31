import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { createBatcher, createLifecycle, toArray } from "./util";

/** Options for `resize()`, adding resize-gesture start/end tracking on top of the base options. */
export interface ResizeOptions extends BaseOptions {
	/** Fires once when a resize gesture begins (first entries after idle). */
	onStart?: ElementsCallback<ResizeObserverEntry>;
	/** Fires once when a resize gesture ends (no entries for `idle` ms). */
	onEnd?: ElementsCallback<ResizeObserverEntry>;
	/** Gap, ms, of silence before a gesture counts as ended. Default 200. */
	idle?: number;
}

/**
 * One ResizeObserver per call, `.observe()` invoked once per target -
 * O(1) native observers regardless of how many targets are passed.
 *
 * @param targets - A single element or array of elements to observe.
 * @param callback - Invoked with every batch of `ResizeObserverEntry`
 * records delivered by the native observer.
 * @param options - `ResizeOptions`, including `onStart`, `onEnd`, `idle`,
 * plus the shared base options.
 * @returns A `Disposer`; call `.disconnect()` to stop observing. Resolves
 * to a no-op disposer in environments without `ResizeObserver`.
 */
export function resize(
	targets: Element | Element[],
	callback: ElementsCallback<ResizeObserverEntry>,
	options: ResizeOptions = {},
): Disposer {
	const list = toArray(targets);

	if (typeof ResizeObserver === "undefined") {
		return { disconnect() {} };
	}

	const batcher = createBatcher<ResizeObserverEntry>((entries) => {
		callback(entries);
		lifecycle.markFired();
	}, options.debounce);

	// Gesture tracking: one shared idle timer per watcher, not per-target.
	const idleMs = options.idle ?? 200;
	let sessionActive = false;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	const latest = new Map<Element, ResizeObserverEntry>();

	function endSession() {
		idleTimer = undefined;
		if (!sessionActive) return;
		sessionActive = false;
		const entries = Array.from(latest.values());
		latest.clear();
		if (entries.length) options.onEnd?.(entries);
	}

	const observer = new ResizeObserver((entries) => {
		if (!sessionActive) {
			sessionActive = true;
			options.onStart?.(entries);
		}
		entries.forEach((e) => latest.set(e.target, e));
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(endSession, idleMs);
		batcher.push(entries);
	});

	const lifecycle = createLifecycle(options, () => {
		observer.disconnect();
		if (idleTimer) clearTimeout(idleTimer);
	});

	list.forEach((target) => observer.observe(target));

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}

/**
 * Sugar: only care about resize gesture start.
 *
 * @param targets - A single element or array of elements to observe.
 * @param callback - Invoked once per resize gesture, with the entries that
 * triggered it.
 * @param options - Same options as `resize()`; `onStart` is set internally.
 * @returns A `Disposer`; call `.disconnect()` to stop observing.
 */
resize.start = function start(
	targets: Element | Element[],
	callback: ElementsCallback<ResizeObserverEntry>,
	options: ResizeOptions = {},
): Disposer {
	return resize(targets, () => {}, { ...options, onStart: callback });
};

/**
 * Sugar: only care about resize gesture end.
 *
 * @param targets - A single element or array of elements to observe.
 * @param callback - Invoked once per resize gesture, with the last-known
 * entries for each target once the gesture goes idle.
 * @param options - Same options as `resize()`; `onEnd` is set internally.
 * @returns A `Disposer`; call `.disconnect()` to stop observing.
 */
resize.end = function end(
	targets: Element | Element[],
	callback: ElementsCallback<ResizeObserverEntry>,
	options: ResizeOptions = {},
): Disposer {
	return resize(targets, () => {}, { ...options, onEnd: callback });
};
