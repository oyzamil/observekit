//#region src/types.d.ts
/** A DOM scope that a watcher can be attached to. */
type Root = Document | Element;
/** Handle returned by every `observekit.*` watcher, used to tear it down. */
interface Disposer {
  /** Stops the watcher and releases any underlying native observers. */
  disconnect(): void;
}
/** Options shared by every observekit.* watcher. */
interface BaseOptions {
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
interface ElementOptions extends BaseOptions {
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
type ElementsCallback<T = Element> = (elements: T[]) => void;
/**
 * Matches an element's normalized (whitespace-collapsed, trimmed)
 * textContent. String = exact match; RegExp = tested against the
 * normalized text; function = custom predicate.
 */
type TextMatcher = string | RegExp | ((text: string) => boolean);
/** Split add/remove callback pair, as accepted by {@link element}'s `callback` param. */
interface AddRemoveCallbacks {
  /** Called with elements newly matching the selector. */
  add?: ElementsCallback;
  /** Called with elements that previously matched but no longer do (e.g. removed from the DOM). */
  remove?: ElementsCallback;
}
/**
 * Callback shape accepted by `element()`/`selector()`: either a single
 * function (treated as `onAdd`) or an explicit `{ add, remove }` pair.
 */
type ElementCallback = ElementsCallback | AddRemoveCallbacks;
//#endregion
//#region src/attribute.d.ts
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
declare function attribute(targets: Element | Element[], attrs: string[], callback: ElementsCallback, options?: BaseOptions): Disposer;
//#endregion
//#region src/children.d.ts
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
declare function children(targets: Element | Element[], callback: ElementsCallback, options?: BaseOptions): Disposer;
//#endregion
//#region src/element.d.ts
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
declare function element(selector: string, callback: ElementCallback, options?: ElementOptions): Disposer;
/** Sugar alias over `element`, arrive.js-style. */
declare const selector: typeof element;
//#endregion
//#region src/intersection.d.ts
/** Options for `visible()`, layered on top of `IntersectionObserver` init options. */
interface VisibleOptions extends BaseOptions {
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
declare function visible(targets: Element | Element[], callback: ElementsCallback<IntersectionObserverEntry>, options?: VisibleOptions): Disposer;
//#endregion
//#region src/performance.d.ts
/** Options for `performance_()`, layered on top of `PerformanceObserver` init options. */
interface PerformanceOptions extends BaseOptions {
  /** Include performance entries recorded before this observer was created. Defaults to `true`. */
  buffered?: boolean;
}
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
declare function performance_(entryTypes: string[], callback: ElementsCallback<PerformanceEntry>, options?: PerformanceOptions): Disposer;
//#endregion
//#region src/reporting.d.ts
/** A single report delivered by `ReportingObserver` (deprecation, intervention, crash, etc.). */
interface Report {
  type: string;
  url: string;
  body: unknown;
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
declare function reports(types: string[], callback: (reports: Report[]) => void, options?: BaseOptions): Disposer;
//#endregion
//#region src/resize.d.ts
/** Options for `resize()`, adding resize-gesture start/end tracking on top of the base options. */
interface ResizeOptions extends BaseOptions {
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
declare function resize(targets: Element | Element[], callback: ElementsCallback<ResizeObserverEntry>, options?: ResizeOptions): Disposer;
declare namespace resize {
  var start: (targets: Element | Element[], callback: ElementsCallback<ResizeObserverEntry>, options?: ResizeOptions) => Disposer;
  var end: (targets: Element | Element[], callback: ElementsCallback<ResizeObserverEntry>, options?: ResizeOptions) => Disposer;
}
//#endregion
//#region src/text.d.ts
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
declare function text(targets: Element | Element[], callback: ElementsCallback, options?: BaseOptions): Disposer;
//#endregion
//#region src/index.d.ts
/**
 * Declarative config accepted by the `observekit(config)` call form. Each
 * key is a no-arg setup function the caller provides; ObserveKit simply
 * invokes whichever ones are present.
 */
interface ObserveKitConfig {
  mutation?: () => void;
  resize?: () => void;
  intersection?: () => void;
  performance?: () => void;
}
/**
 * Calling `observekit({...})` is a no-op convenience form for consumers who
 * want a single declarative entry point; prefer the named, tree-shakeable
 * `observekit.*` methods below for real usage.
 *
 * @param config - Setup functions to invoke for each requested observer kind.
 * @returns A `Disposer` whose `disconnect()` is a no-op.
 */
declare function observekitFn(config: ObserveKitConfig): Disposer;
/**
 * ObserveKit's default export: a callable convenience form
 * (`observekit(config)`) also exposing every named watcher as a method
 * (`observekit.element`, `observekit.resize`, etc.) for tree-shakeable,
 * direct usage.
 */
declare const observekit: typeof observekitFn & {
  element: typeof element;
  selector: typeof selector;
  attribute: typeof attribute;
  children: typeof children;
  text: typeof text;
  resize: typeof resize;
  visible: typeof visible;
  performance: typeof performance_;
  reports: typeof reports;
};
//#endregion
export { type AddRemoveCallbacks, type BaseOptions, type Disposer, type ElementCallback, type ElementOptions, type ElementsCallback, ObserveKitConfig, type PerformanceOptions, type Report, type ResizeOptions, type Root, type TextMatcher, type VisibleOptions, type attribute, type children, observekit as default, observekit, type element, observekitFn, type performance_ as performance, type reports, type resize, type selector, type text, type visible };