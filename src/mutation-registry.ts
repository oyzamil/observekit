import type { Root, TextMatcher } from "./types";

import { collectElements, matchesText } from "./util";

/** Internal registration record for `element()`/`selector()` watchers. */
export interface ElementWatcher {
	selector: string;
	textMatcher?: TextMatcher;
	fireOnAttributesModification: boolean;
	onAdd?: (els: Element[]) => void;
	onRemove?: (els: Element[]) => void;
	/** Elements currently believed to be matched & present, for attribute re-fires. */
	matched: Set<Element>;
}

/** The kind of change a {@link TargetWatcher} reacts to. */
export type TargetWatcherKind = "attribute" | "children" | "text";

/** Internal registration record for `attribute()`/`children()`/`text()` watchers. */
export interface TargetWatcher {
	kind: TargetWatcherKind;
	/** For kind === 'attribute': the specific attribute names to react to (empty = all). */
	attrs?: string[];
	onFire: (els: Element[]) => void;
}

/** Per-root bookkeeping: the shared native observer plus all registered watchers. */
interface RootEntry {
	observer: MutationObserver;
	elementWatchers: Set<ElementWatcher>;
	targetWatchers: Map<Element, Set<TargetWatcher>>;
}

const roots = new Map<Root, RootEntry>();

/**
 * Returns the existing `RootEntry` for `root`, or creates and registers a
 * new one (including its single native `MutationObserver`) if none exists.
 */
function getOrCreateEntry(root: Root): RootEntry {
	let entry = roots.get(root);
	if (entry) return entry;

	const elementWatchers = new Set<ElementWatcher>();
	const targetWatchers = new Map<Element, Set<TargetWatcher>>();

	const observer = new MutationObserver((mutations) =>
		handleMutations(entry!, mutations),
	);
	entry = { observer, elementWatchers, targetWatchers };
	roots.set(root, entry);

	// One native observer per root, always subscribed to the full mutation
	// surface. Watcher-specific filtering happens in JS in handleMutations,
	// so adding/removing watchers never requires re-calling observe().
	observer.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		characterData: true,
	});

	return entry;
}

/** Disconnects and removes a root's native observer once it has no watchers left. */
function maybeTeardown(root: Root, entry: RootEntry): void {
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
export function registerElementWatcher(
	root: Root,
	watcher: ElementWatcher,
): () => void {
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
export function registerTargetWatcher(
	root: Root,
	target: Element,
	watcher: TargetWatcher,
): () => void {
	const entry = getOrCreateEntry(root);
	let set = entry.targetWatchers.get(target);
	if (!set) {
		set = new Set();
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
function handleMutations(entry: RootEntry, mutations: MutationRecord[]): void {
	const hasElementWatchers = entry.elementWatchers.size > 0;
	const hasTargetWatchers = entry.targetWatchers.size > 0;
	if (!hasElementWatchers && !hasTargetWatchers) return;

	const addedEls: Element[] = [];
	const removedEls: Element[] = [];
	const attrTargets = new Map<Element, Set<string>>();
	const childListTargets = new Map<Element, Element[]>();
	const textTargets = new Set<Element>();

	for (const m of mutations) {
		if (m.type === "childList") {
			if (hasElementWatchers) {
				m.addedNodes.forEach((n) => collectElements(n, addedEls));
				m.removedNodes.forEach((n) => collectElements(n, removedEls));
			}
			if (hasTargetWatchers && m.target.nodeType === Node.ELEMENT_NODE) {
				const targetEl = m.target as Element;
				if (entry.targetWatchers.has(targetEl)) {
					let list = childListTargets.get(targetEl);
					if (!list) {
						list = [];
						childListTargets.set(targetEl, list);
					}
					m.addedNodes.forEach(
						(n) => n.nodeType === Node.ELEMENT_NODE && list!.push(n as Element),
					);
					m.removedNodes.forEach(
						(n) => n.nodeType === Node.ELEMENT_NODE && list!.push(n as Element),
					);
				}
			}
		} else if (m.type === "attributes") {
			const targetEl = m.target as Element;
			let names = attrTargets.get(targetEl);
			if (!names) {
				names = new Set();
				attrTargets.set(targetEl, names);
			}
			if (m.attributeName) names.add(m.attributeName);
		} else if (m.type === "characterData") {
			const parent = m.target.parentElement;
			if (parent) textTargets.add(parent);
		}
	}

	if (hasElementWatchers)
		dispatchElementWatchers(entry, addedEls, removedEls, attrTargets);
	if (hasTargetWatchers)
		dispatchTargetWatchers(entry, attrTargets, childListTargets, textTargets);
}

/**
 * Matches added/removed elements and attribute-changed targets against every
 * registered `ElementWatcher` on `entry`, firing `onAdd`/`onRemove` as
 * appropriate and keeping each watcher's `matched` set in sync.
 */
function dispatchElementWatchers(
	entry: RootEntry,
	addedEls: Element[],
	removedEls: Element[],
	attrTargets: Map<Element, Set<string>>,
): void {
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
			// With a textMatcher, an element's text is unreliable once detached,
			// so removal is decided solely by prior membership in `matched`
			// (never re-derived from selector/text on the removed node).
			const matched = removedEls.filter(
				(el) => w.matched.has(el) || (!w.textMatcher && el.matches(w.selector)),
			);
			if (matched.length) {
				matched.forEach((el) => w.matched.delete(el));
				w.onRemove(matched);
			}
		}
		if (w.fireOnAttributesModification && attrTargets.size && w.onAdd) {
			const refired: Element[] = [];
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
function dispatchTargetWatchers(
	entry: RootEntry,
	attrTargets: Map<Element, Set<string>>,
	childListTargets: Map<Element, Element[]>,
	textTargets: Set<Element>,
): void {
	attrTargets.forEach((names, target) => {
		const watchers = entry.targetWatchers.get(target);
		if (!watchers) return;
		for (const w of watchers) {
			if (w.kind !== "attribute") continue;
			if (w.attrs && w.attrs.length > 0) {
				const hit = w.attrs.some((a) => names.has(a));
				if (!hit) continue;
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
