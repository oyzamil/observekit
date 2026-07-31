/** A DOM scope that a watcher can be attached to. */
export type Root = Document | Element;

/** Handle returned by every `observekit.*` watcher, used to tear it down. */
export interface Disposer {
	/** Stops the watcher and releases any underlying native observers. */
	disconnect(): void;
}

/** Options shared by every observekit.* watcher. */
export interface BaseOptions {
	/** Disconnect the watcher when this signal aborts. */
	signal?: AbortSignal;
	/** Auto-disconnect after the first delivered batch. */
	once?: boolean;
	/** Coalesce rapid native callback fires into a single batch, ms. */
	debounce?: number;
	/** Auto-disconnect after this many ms if nothing has matched yet. */
	timeout?: number;
	/** Called synchronously once the watcher is registered. */
	onConnect?: () => void;
	/** Called once, when the watcher disconnects (manually, once, timeout, or signal abort). */
	onDisconnect?: () => void;
}

/** Options for element/selector watchers. */
export interface ElementOptions extends BaseOptions {
	/** Scope to observe. Defaults to `document`. */
	root?: Root;
	/**
	 * On registration, immediately scan `root` for elements already matching
	 * the selector and fire the add callback for them before watching future
	 * insertions. Defaults to `true`.
	 */
	existing?: boolean;
	/**
	 * Re-fire the add callback for an already-matched element when one of its
	 * attributes changes (not just on insertion). Defaults to `false`.
	 */
	fireOnAttributesModification?: boolean;
	/**
	 * Further restrict matches to elements whose textContent satisfies this
	 * matcher. Applied on top of `selector` — scope `selector` narrowly
	 * (e.g. `'button'`, not `'*'`) so a matching leaf and its matching
	 * ancestor don't both fire for the same text.
	 */
	text?: TextMatcher;
}

/**
 * Callback invoked with a batch of matched/changed items.
 * @typeParam T - The item type delivered per batch. Defaults to `Element`.
 */
export type ElementsCallback<T = Element> = (elements: T[]) => void;

/**
 * Matches an element's normalized (whitespace-collapsed, trimmed)
 * textContent. String = exact match; RegExp = tested against the
 * normalized text; function = custom predicate.
 */
export type TextMatcher = string | RegExp | ((text: string) => boolean);

/** Split add/remove callback pair, as accepted by {@link element}'s `callback` param. */
export interface AddRemoveCallbacks {
	/** Called with elements newly matching the selector. */
	add?: ElementsCallback;
	/** Called with elements that previously matched but no longer do (e.g. removed from the DOM). */
	remove?: ElementsCallback;
}

/**
 * Callback shape accepted by `element()`/`selector()`: either a single
 * function (treated as `onAdd`) or an explicit `{ add, remove }` pair.
 */
export type ElementCallback = ElementsCallback | AddRemoveCallbacks;
