/*! observekit v0.0.4 - iife | M.Muzammil <https://muzammil.work/> | MIT License */
(function() {

//#region src/util.ts
/** Collapse whitespace and trim, so markup formatting doesn't affect matches. */
	function normalizeText(s) {
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
	function matchesText(el, matcher) {
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
	function createBatcher(deliver, ms) {
		let buffer = [];
		let timer;
		let microtaskScheduled = false;
		function flush() {
			timer = void 0;
			microtaskScheduled = false;
			if (!buffer.length) return;
			const out = buffer;
			buffer = [];
			deliver(out);
		}
		return {
			/** Queue items for delivery; empty arrays are ignored. */
			push(items) {
				if (!items.length) return;
				buffer.push(...items);
				if (ms) {
					if (timer) clearTimeout(timer);
					timer = setTimeout(flush, ms);
				} else if (!microtaskScheduled) {
					microtaskScheduled = true;
					queueMicrotask(flush);
				}
			},
			/** Cancel any pending timer/microtask flush and discard buffered items. */
			clear() {
				if (timer) clearTimeout(timer);
				timer = void 0;
				microtaskScheduled = false;
				buffer = [];
			}
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
	function createLifecycle(options, onDisconnect) {
		let disconnected = false;
		let timeoutId;
		function disconnect() {
			if (disconnected) return;
			disconnected = true;
			if (timeoutId) clearTimeout(timeoutId);
			onDisconnect();
			options?.onDisconnect?.();
		}
		if (options?.timeout) timeoutId = setTimeout(disconnect, options.timeout);
		if (options?.signal) if (options.signal.aborted) queueMicrotask(disconnect);
		else options.signal.addEventListener("abort", disconnect, { once: true });
		options?.onConnect?.();
		return {
			disconnect,
			disconnected: () => disconnected,
			markFired() {
				if (timeoutId) {
					clearTimeout(timeoutId);
					timeoutId = void 0;
				}
				if (options?.once) disconnect();
			}
		};
	}
	/**
	* Recursively collect an element and all its descendant elements into `into`.
	*
	* @param node - The node to start from; non-element nodes are ignored.
	* @param into - Destination array that collected elements are pushed onto.
	*/
	function collectElements(node, into) {
		if (node.nodeType !== Node.ELEMENT_NODE) return;
		const el = node;
		into.push(el);
		el.querySelectorAll("*").forEach((d) => into.push(d));
	}
	/**
	* Normalizes a single value or array into an array.
	*
	* @typeParam T - The element type.
	* @param value - A single value or an array of values.
	* @returns `value` unchanged if it's already an array, otherwise `[value]`.
	*/
	function toArray(value) {
		return Array.isArray(value) ? value : [value];
	}

//#endregion
//#region src/mutation-registry.ts
	const roots = /* @__PURE__ */ new Map();
	/**
	* Returns the existing `RootEntry` for `root`, or creates and registers a
	* new one (including its single native `MutationObserver`) if none exists.
	*/
	function getOrCreateEntry(root) {
		let entry = roots.get(root);
		if (entry) return entry;
		const elementWatchers = /* @__PURE__ */ new Set();
		const targetWatchers = /* @__PURE__ */ new Map();
		const observer = new MutationObserver((mutations) => handleMutations(entry, mutations));
		entry = {
			observer,
			elementWatchers,
			targetWatchers
		};
		roots.set(root, entry);
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true
		});
		return entry;
	}
	/** Disconnects and removes a root's native observer once it has no watchers left. */
	function maybeTeardown(root, entry) {
		if (entry.elementWatchers.size === 0 && entry.targetWatchers.size === 0) {
			entry.observer.disconnect();
			roots.delete(root);
		}
	}
	/**
	* Registers a selector-based element watcher against `root`, creating the
	* root's shared `MutationObserver` on first use.
	*
	* @param root - The document/element scope to watch.
	* @param watcher - The watcher record to register.
	* @returns An unregister function; safe to call once to remove the watcher
	* (and tear down the native observer if it was the last one on `root`).
	*/
	function registerElementWatcher(root, watcher) {
		const entry = getOrCreateEntry(root);
		entry.elementWatchers.add(watcher);
		return () => {
			entry.elementWatchers.delete(watcher);
			maybeTeardown(root, entry);
		};
	}
	/**
	* Registers a target-based watcher (attribute/children/text) for a specific
	* `target` element under `root`, creating the root's shared
	* `MutationObserver` on first use.
	*
	* @param root - The document/element scope to watch.
	* @param target - The specific element the watcher cares about.
	* @param watcher - The watcher record to register.
	* @returns An unregister function; safe to call once to remove the watcher
	* (and tear down the native observer if it was the last one on `root`).
	*/
	function registerTargetWatcher(root, target, watcher) {
		const entry = getOrCreateEntry(root);
		let set = entry.targetWatchers.get(target);
		if (!set) {
			set = /* @__PURE__ */ new Set();
			entry.targetWatchers.set(target, set);
		}
		set.add(watcher);
		return () => {
			const s = entry.targetWatchers.get(target);
			if (!s) return;
			s.delete(watcher);
			if (s.size === 0) entry.targetWatchers.delete(target);
			maybeTeardown(root, entry);
		};
	}
	/**
	* Processes one native MutationObserver batch exactly once: walks
	* addedNodes/removedNodes a single time (collectElements), then tests every
	* registered selector against that single walk with `matches()`. Cost is
	* O(batch size * selector count) with zero extra querySelectorAll calls per
	* selector and zero extra native observers.
	*
	* @param entry - The root entry whose watchers should be dispatched to.
	* @param mutations - The raw mutation records delivered by the native observer.
	*/
	function handleMutations(entry, mutations) {
		const hasElementWatchers = entry.elementWatchers.size > 0;
		const hasTargetWatchers = entry.targetWatchers.size > 0;
		if (!hasElementWatchers && !hasTargetWatchers) return;
		const addedEls = [];
		const removedEls = [];
		const attrTargets = /* @__PURE__ */ new Map();
		const childListTargets = /* @__PURE__ */ new Map();
		const textTargets = /* @__PURE__ */ new Set();
		for (const m of mutations) if (m.type === "childList") {
			if (hasElementWatchers) {
				m.addedNodes.forEach((n) => collectElements(n, addedEls));
				m.removedNodes.forEach((n) => collectElements(n, removedEls));
			}
			if (hasTargetWatchers && m.target.nodeType === Node.ELEMENT_NODE) {
				const targetEl = m.target;
				if (entry.targetWatchers.has(targetEl)) {
					let list = childListTargets.get(targetEl);
					if (!list) {
						list = [];
						childListTargets.set(targetEl, list);
					}
					m.addedNodes.forEach((n) => n.nodeType === Node.ELEMENT_NODE && list.push(n));
					m.removedNodes.forEach((n) => n.nodeType === Node.ELEMENT_NODE && list.push(n));
				}
			}
		} else if (m.type === "attributes") {
			const targetEl = m.target;
			let names = attrTargets.get(targetEl);
			if (!names) {
				names = /* @__PURE__ */ new Set();
				attrTargets.set(targetEl, names);
			}
			if (m.attributeName) names.add(m.attributeName);
		} else if (m.type === "characterData") {
			const parent = m.target.parentElement;
			if (parent) textTargets.add(parent);
		}
		if (hasElementWatchers) dispatchElementWatchers(entry, addedEls, removedEls, attrTargets);
		if (hasTargetWatchers) dispatchTargetWatchers(entry, attrTargets, childListTargets, textTargets);
	}
	/**
	* Matches added/removed elements and attribute-changed targets against every
	* registered `ElementWatcher` on `entry`, firing `onAdd`/`onRemove` as
	* appropriate and keeping each watcher's `matched` set in sync.
	*/
	function dispatchElementWatchers(entry, addedEls, removedEls, attrTargets) {
		for (const w of entry.elementWatchers) {
			if (addedEls.length && w.onAdd) {
				let matched = addedEls.filter((el) => el.matches(w.selector));
				if (w.textMatcher) {
					const tm = w.textMatcher;
					matched = matched.filter((el) => matchesText(el, tm));
				}
				if (matched.length) {
					matched.forEach((el) => w.matched.add(el));
					w.onAdd(matched);
				}
			}
			if (removedEls.length && w.onRemove) {
				const matched = removedEls.filter((el) => w.matched.has(el) || !w.textMatcher && el.matches(w.selector));
				if (matched.length) {
					matched.forEach((el) => w.matched.delete(el));
					w.onRemove(matched);
				}
			}
			if (w.fireOnAttributesModification && attrTargets.size && w.onAdd) {
				const refired = [];
				attrTargets.forEach((_names, el) => {
					if (w.matched.has(el) && el.matches(w.selector)) refired.push(el);
				});
				if (refired.length) w.onAdd(refired);
			}
		}
	}
	/**
	* Routes attribute/children/text mutation data to the `TargetWatcher`s
	* registered for each specific target element on `entry`.
	*/
	function dispatchTargetWatchers(entry, attrTargets, childListTargets, textTargets) {
		attrTargets.forEach((names, target) => {
			const watchers = entry.targetWatchers.get(target);
			if (!watchers) return;
			for (const w of watchers) {
				if (w.kind !== "attribute") continue;
				if (w.attrs && w.attrs.length > 0) {
					if (!w.attrs.some((a) => names.has(a))) continue;
				}
				w.onFire([target]);
			}
		});
		childListTargets.forEach((changed, target) => {
			const watchers = entry.targetWatchers.get(target);
			if (!watchers) return;
			for (const w of watchers) {
				if (w.kind !== "children") continue;
				w.onFire(changed);
			}
		});
		textTargets.forEach((target) => {
			const watchers = entry.targetWatchers.get(target);
			if (!watchers) return;
			for (const w of watchers) {
				if (w.kind !== "text") continue;
				w.onFire([target]);
			}
		});
	}

//#endregion
//#region src/attribute.ts
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
	function attribute(targets, attrs, callback, options = {}) {
		const list = toArray(targets);
		const batcher = createBatcher((items) => {
			callback(items);
			lifecycle.markFired();
		}, options.debounce);
		const lifecycle = createLifecycle(options, () => unregisterAll.forEach((fn) => fn()));
		const unregisterAll = list.map((target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
			kind: "attribute",
			attrs,
			onFire: (els) => batcher.push(els)
		}));
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/children.ts
/**
	* Watches one or more specific elements for direct child list changes
	* (elements added to or removed from the target), firing `callback` with
	* the affected child element(s).
	*
	* @param targets - A single element or array of elements to watch.
	* @param callback - Invoked with the batch of added/removed child elements.
	* @param options - Shared watcher options (debounce, once, timeout, etc.).
	* @returns A `Disposer`; call `.disconnect()` to stop watching.
	*/
	function children(targets, callback, options = {}) {
		const list = toArray(targets);
		const batcher = createBatcher((items) => {
			callback(items);
			lifecycle.markFired();
		}, options.debounce);
		const lifecycle = createLifecycle(options, () => unregisterAll.forEach((fn) => fn()));
		const unregisterAll = list.map((target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
			kind: "children",
			onFire: (els) => batcher.push(els)
		}));
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/element.ts
/**
	* Normalizes the `ElementCallback` union into an explicit `onAdd`/`onRemove`
	* pair. A plain function is treated as `onAdd` only.
	*/
	function normalizeCallback(cb) {
		if (typeof cb === "function") return { onAdd: cb };
		return {
			onAdd: cb.add,
			onRemove: cb.remove
		};
	}
	/**
	* Watches `root` (default `document`) for elements matching `selector`
	* being added to or removed from the DOM, arrive.js-style. Also available
	* as the `selector()` alias.
	*
	* @param selector - CSS selector to match against added/removed elements.
	* @param callback - Either a single function (treated as the "add"
	* callback) or a `{ add, remove }` pair.
	* @param options - Element watcher options, including `root`, `existing`,
	* `text`, and `fireOnAttributesModification`, plus the shared base options.
	* @returns A `Disposer`; call `.disconnect()` to stop watching.
	*/
	function element(selector, callback, options = {}) {
		const root = options.root ?? document;
		const { onAdd, onRemove } = normalizeCallback(callback);
		const lifecycle = createLifecycle(options, () => unregister());
		const addBatcher = createBatcher((items) => {
			onAdd?.(items);
			lifecycle.markFired();
		}, options.debounce);
		const removeBatcher = createBatcher((items) => {
			onRemove?.(items);
		}, options.debounce);
		const watcher = {
			selector,
			textMatcher: options.text,
			fireOnAttributesModification: options.fireOnAttributesModification ?? false,
			matched: /* @__PURE__ */ new Set(),
			onAdd: onAdd ? (els) => addBatcher.push(els) : void 0,
			onRemove: onRemove ? (els) => removeBatcher.push(els) : void 0
		};
		const unregister = registerElementWatcher(root, watcher);
		if ((options.existing ?? true) && !lifecycle.disconnected()) {
			const scanRoot = root;
			let preexisting = Array.from(scanRoot.querySelectorAll(selector));
			if (options.text) {
				const tm = options.text;
				preexisting = preexisting.filter((el) => matchesText(el, tm));
			}
			if (preexisting.length) {
				preexisting.forEach((el) => watcher.matched.add(el));
				onAdd?.(preexisting);
				lifecycle.markFired();
			}
		}
		return { disconnect() {
			addBatcher.clear();
			removeBatcher.clear();
			lifecycle.disconnect();
		} };
	}
	/** Sugar alias over `element`, arrive.js-style. */
	const selector = element;

//#endregion
//#region src/intersection.ts
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
	function visible(targets, callback, options = {}) {
		const list = toArray(targets);
		if (typeof IntersectionObserver === "undefined") return { disconnect() {} };
		const batcher = createBatcher((entries) => {
			callback(entries);
			lifecycle.markFired();
		}, options.debounce);
		const rootMargin = options.rootMargin ?? (options.offset != null ? typeof options.offset === "number" ? `${options.offset}px` : options.offset : void 0);
		const observer = new IntersectionObserver((entries) => batcher.push(entries), {
			root: options.root,
			rootMargin,
			threshold: options.threshold
		});
		const lifecycle = createLifecycle(options, () => observer.disconnect());
		list.forEach((target) => observer.observe(target));
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/performance.ts
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
	function performance_(entryTypes, callback, options = {}) {
		if (typeof PerformanceObserver === "undefined") return { disconnect() {} };
		const batcher = createBatcher((entries) => {
			callback(entries);
			lifecycle.markFired();
		}, options.debounce);
		const observer = new PerformanceObserver((list) => batcher.push(list.getEntries()));
		const lifecycle = createLifecycle(options, () => observer.disconnect());
		if (entryTypes.length === 1) observer.observe({
			type: entryTypes[0],
			buffered: options.buffered ?? true
		});
		else observer.observe({ entryTypes });
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/reporting.ts
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
	function reports(types, callback, options = {}) {
		const Ctor = globalThis.ReportingObserver;
		if (!Ctor) return { disconnect() {} };
		const batcher = createBatcher((items) => {
			callback(items);
			lifecycle.markFired();
		}, options.debounce);
		const observer = new Ctor((list) => batcher.push(list), {
			types,
			buffered: true
		});
		const lifecycle = createLifecycle(options, () => observer.disconnect());
		observer.observe();
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/resize.ts
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
	function resize(targets, callback, options = {}) {
		const list = toArray(targets);
		if (typeof ResizeObserver === "undefined") return { disconnect() {} };
		const batcher = createBatcher((entries) => {
			callback(entries);
			lifecycle.markFired();
		}, options.debounce);
		const idleMs = options.idle ?? 200;
		let sessionActive = false;
		let idleTimer;
		const latest = /* @__PURE__ */ new Map();
		function endSession() {
			idleTimer = void 0;
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
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
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
	resize.start = function start(targets, callback, options = {}) {
		return resize(targets, () => {}, {
			...options,
			onStart: callback
		});
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
	resize.end = function end(targets, callback, options = {}) {
		return resize(targets, () => {}, {
			...options,
			onEnd: callback
		});
	};

//#endregion
//#region src/text.ts
/**
	* Watches one or more specific elements for changes to their text content
	* (via `characterData` mutations on descendant text nodes), firing
	* `callback` with the target element(s) whose text changed.
	*
	* @param targets - A single element or array of elements to watch.
	* @param callback - Invoked with the batch of elements whose text changed.
	* @param options - Shared watcher options (debounce, once, timeout, etc.).
	* @returns A `Disposer`; call `.disconnect()` to stop watching.
	*/
	function text(targets, callback, options = {}) {
		const list = toArray(targets);
		const batcher = createBatcher((items) => {
			callback(items);
			lifecycle.markFired();
		}, options.debounce);
		const lifecycle = createLifecycle(options, () => unregisterAll.forEach((fn) => fn()));
		const unregisterAll = list.map((target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
			kind: "text",
			onFire: (els) => batcher.push(els)
		}));
		return { disconnect() {
			batcher.clear();
			lifecycle.disconnect();
		} };
	}

//#endregion
//#region src/index.ts
/**
	* Calling `observekit({...})` is a no-op convenience form for consumers who
	* want a single declarative entry point; prefer the named, tree-shakeable
	* `observekit.*` methods below for real usage.
	*
	* @param config - Setup functions to invoke for each requested observer kind.
	* @returns A `Disposer` whose `disconnect()` is a no-op.
	*/
	function observekitFn(config) {
		config.mutation?.();
		config.resize?.();
		config.intersection?.();
		config.performance?.();
		return { disconnect() {} };
	}
	/**
	* ObserveKit's default export: a callable convenience form
	* (`observekit(config)`) also exposing every named watcher as a method
	* (`observekit.element`, `observekit.resize`, etc.) for tree-shakeable,
	* direct usage.
	*/
	const observekit = Object.assign(observekitFn, {
		element,
		selector,
		attribute,
		children,
		text,
		resize,
		visible,
		performance: performance_,
		reports
	});

//#endregion
//#region src/browser.ts
	globalThis.observekit = observekit;

//#endregion
})();