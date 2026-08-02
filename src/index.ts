import type { Disposer } from "./types";

import { attribute } from "./attribute";
import { children } from "./children";
import { element, selector } from "./element";
import { visible } from "./intersection";
import { performance_ } from "./performance";
import { reports } from "./reporting";
import { resize } from "./resize";
import { text } from "./text";

export type { attribute } from "./attribute";
export type { children } from "./children";
export type { element, selector } from "./element";
export type { VisibleOptions, visible } from "./intersection";
export type {
	PerformanceOptions,
	performance_ as performance,
} from "./performance";
export type { Report, reports } from "./reporting";
export type { ResizeOptions, resize } from "./resize";
export type { text } from "./text";
export type {
	AddRemoveCallbacks,
	BaseOptions,
	Disposer,
	ElementCallback,
	ElementOptions,
	ElementsCallback,
	Root,
	TextMatcher,
} from "./types";

/**
 * Declarative config accepted by the `observekit(config)` call form. Each
 * key is a no-arg setup function the caller provides; ObserveKit simply
 * invokes whichever ones are present.
 */
export interface ObserveKitConfig {
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
export function observekitFn(config: ObserveKitConfig): Disposer {
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
export const observekit: typeof observekitFn & {
	element: typeof element;
	selector: typeof selector;
	attribute: typeof attribute;
	children: typeof children;
	text: typeof text;
	resize: typeof resize;
	visible: typeof visible;
	performance: typeof performance_;
	reports: typeof reports;
} = Object.assign(observekitFn, {
	element,
	selector,
	attribute,
	children,
	text,
	resize,
	visible,
	performance: performance_,
	reports,
});

export default observekit;
