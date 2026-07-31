import type { BaseOptions, Disposer, ElementsCallback } from "./types";

import { createBatcher, createLifecycle, toArray } from "./util";

/** Options for `visible()`, layered on top of `IntersectionObserver` init options. */
export interface VisibleOptions extends BaseOptions {
	root?: Element | Document | null;
	rootMargin?: string;
	threshold?: number | number[];
	/**
	 * Convenience for expanding the root's bounding box before intersection
	 * triggers, so the callback fires slightly before the element is
	 * actually visible on screen ("near to appear"). A number is treated as
	 * px on all sides; a string is used as-is (same syntax as CSS margin).
	 * Ignored if `rootMargin` is also given.
	 */
	offset?: number | string;
}

/**
 * One IntersectionObserver per call, `.observe()` invoked once per target -
 * O(1) native observers regardless of how many targets are passed.
 *
 * @param targets - A single element or array of elements to observe.
 * @param callback - Invoked with the batch of `IntersectionObserverEntry`
 * records delivered by the native observer.
 * @param options - `VisibleOptions`, including `root`, `rootMargin`,
 * `threshold`, `offset`, plus the shared base options.
 * @returns A `Disposer`; call `.disconnect()` to stop observing. Resolves
 * to a no-op disposer in environments without `IntersectionObserver`.
 */
export function visible(
	targets: Element | Element[],
	callback: ElementsCallback<IntersectionObserverEntry>,
	options: VisibleOptions = {},
): Disposer {
	const list = toArray(targets);

	if (typeof IntersectionObserver === "undefined") {
		return { disconnect() {} };
	}

	const batcher = createBatcher<IntersectionObserverEntry>((entries) => {
		callback(entries);
		lifecycle.markFired();
	}, options.debounce);

	const rootMargin =
		options.rootMargin ??
		(options.offset != null
			? typeof options.offset === "number"
				? `${options.offset}px`
				: options.offset
			: undefined);

	const observer = new IntersectionObserver(
		(entries) => batcher.push(entries),
		{
			root: options.root,
			rootMargin,
			threshold: options.threshold,
		},
	);
	const lifecycle = createLifecycle(options, () => observer.disconnect());

	list.forEach((target) => observer.observe(target));

	return {
		disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		},
	};
}
