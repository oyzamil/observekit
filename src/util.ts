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

/** Recursively collect an element and all its descendant elements into `into`. */
export function collectElements(node: Node, into: Element[]): void {
	if (node.nodeType !== Node.ELEMENT_NODE) return;
	const el = node as Element;
	into.push(el);
	const descendants = el.querySelectorAll("*");
	descendants.forEach((d) => into.push(d));
}

export function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}

export const noopDisposer: Disposer = { disconnect() {} };
