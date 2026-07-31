export type Root = Document | Element;

export interface Disposer {
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
}

export type ElementsCallback<T = Element> = (elements: T[]) => void;

export interface AddRemoveCallbacks {
	add?: ElementsCallback;
	remove?: ElementsCallback;
}

export type ElementCallback = ElementsCallback | AddRemoveCallbacks;
