import type { BaseOptions, Disposer, TextMatcher } from "./types";

/** Collapse whitespace and trim, so markup formatting doesn't affect matches. */
function normalizeText(s: string): string {
	return s.replace(/\s+/g, " ").trim();
}

/**
 * Tests an element's textContent against a TextMatcher. Deliberately uses
 * `textContent` rather than `innerText` — `innerText` forces a synchronous
 * layout, which is disastrous when called per-element on every mutation
 * batch. `textContent` is a plain tree read.
 *
 * @param el - The element whose (normalized) textContent is tested.
 * @param matcher - String for exact match, RegExp to test against, or a
 * custom predicate function.
 * @returns Whether the element's normalized text satisfies the matcher.
 */
export function matchesText(el: Element, matcher: TextMatcher): boolean {
	const text = normalizeText(el.textContent ?? "");
	if (typeof matcher === "string") return text === matcher;
	if (matcher instanceof RegExp) return matcher.test(text);
	return matcher(text);
}

/**
 * Batch-level debouncer: one timer for the whole watcher, not one per
 * matched item. Items pushed across multiple native ticks within the
 * debounce window are merged into a single delivered array.
 *
 * @typeParam T - The item type being batched.
 * @param deliver - Called with the accumulated items once a batch flushes.
 * @param ms - Optional debounce window in ms. When omitted, pushes within
 * the same tick are coalesced via a single microtask flush instead.
 * @returns An object with `push` (queue items) and `clear` (cancel any
 * pending flush and drop buffered items) methods.
 */
export function createBatcher<T>(deliver: (items: T[]) => void, ms?: number) {
	let buffer: T[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;
	let microtaskScheduled = false;

	function flush() {
		timer = undefined;
		microtaskScheduled = false;
		if (!buffer.length) return;
		const out = buffer;
		buffer = [];
		deliver(out);
	}

	return {
		/** Queue items for delivery; empty arrays are ignored. */
		push(items: T[]) {
			if (!items.length) return;
			buffer.push(...items);
			if (ms) {
				// Explicit debounce window: reset the single timer on every push.
				if (timer) clearTimeout(timer);
				timer = setTimeout(flush, ms);
			} else if (!microtaskScheduled) {
				// No explicit debounce: still coalesce everything pushed within the
				// same tick (e.g. several watchers firing off one native observer
				// batch) into a single delivered callback via one microtask flush.
				microtaskScheduled = true;
				queueMicrotask(flush);
			}
		},
		/** Cancel any pending timer/microtask flush and discard buffered items. */
		clear() {
			if (timer) clearTimeout(timer);
			timer = undefined;
			microtaskScheduled = false;
			buffer = [];
		},
	};
}

/**
 * Shared connect/disconnect lifecycle for a watcher: wires up `signal`,
 * `timeout`, `once`, and connect/disconnect hooks. `disconnect` is
 * idempotent. Call `markFired()` whenever a batch is actually delivered to
 * the user (cancels the pending timeout and, if `once`, disconnects).
 *
 * @param options - The watcher's `BaseOptions`, or `undefined`.
 * @param onDisconnect - Called exactly once, the first time the lifecycle
 * disconnects (via `disconnect()`, `timeout`, `once`, or signal abort).
 * @returns A `Disposer` extended with `markFired()` and `disconnected()`.
 */
export function createLifecycle(
	options: BaseOptions | undefined,
	onDisconnect: () => void,
): Disposer & {
	markFired(): void;
	disconnected(): boolean;
} {
	let disconnected = false;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function disconnect() {
		if (disconnected) return;
		disconnected = true;
		if (timeoutId) clearTimeout(timeoutId);
		onDisconnect();
		options?.onDisconnect?.();
	}

	if (options?.timeout) {
		timeoutId = setTimeout(disconnect, options.timeout);
	}
	if (options?.signal) {
		if (options.signal.aborted) {
			// Deferred so callers can finish wiring up before teardown runs.
			queueMicrotask(disconnect);
		} else {
			options.signal.addEventListener("abort", disconnect, { once: true });
		}
	}
	options?.onConnect?.();

	return {
		disconnect,
		disconnected: () => disconnected,
		markFired() {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			if (options?.once) disconnect();
		},
	};
}

/**
 * Recursively collect an element and all its descendant elements into `into`.
 *
 * @param node - The node to start from; non-element nodes are ignored.
 * @param into - Destination array that collected elements are pushed onto.
 */
export function collectElements(node: Node, into: Element[]): void {
	if (node.nodeType !== Node.ELEMENT_NODE) return;
	const el = node as Element;
	into.push(el);
	const descendants = el.querySelectorAll("*");
	descendants.forEach((d) => into.push(d));
}

/**
 * Normalizes a single value or array into an array.
 *
 * @typeParam T - The element type.
 * @param value - A single value or an array of values.
 * @returns `value` unchanged if it's already an array, otherwise `[value]`.
 */
export function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}

/** A `Disposer` whose `disconnect()` is a no-op, for feature-detection fallbacks. */
export const noopDisposer: Disposer = { disconnect() {} };
