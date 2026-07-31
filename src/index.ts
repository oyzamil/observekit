import type { Disposer } from "./types";

import { attribute } from "./attribute";
import { children } from "./children";
import { element, selector } from "./element";
import { visible } from "./intersection";
import { performance_ } from "./performance";
import { reports } from "./reporting";
import { resize } from "./resize";
import { text } from "./text";

export type { VisibleOptions } from "./intersection";
export type { PerformanceOptions } from "./performance";
export type {
	AddRemoveCallbacks,
	BaseOptions,
	Disposer,
	ElementCallback,
	ElementOptions,
	ElementsCallback,
	Root,
} from "./types";

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
 */
function observekitFn(config: ObserveKitConfig): Disposer {
	config.mutation?.();
	config.resize?.();
	config.intersection?.();
	config.performance?.();
	return { disconnect() {} };
}

export const observekit = Object.assign(observekitFn, {
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
