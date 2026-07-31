# observekit — API Reference

## Import

```ts
import observekit from "observekit";
// or named: import { watchElement, watchSelector, watchAttribute, watchChildren, watchText, watchResize, watchVisible, watchPerformance, watchReporting } from "observekit";
```

All methods return `{ disconnect(): void }`.

## Methods

```ts
observekit.element(selector: string, { add?, remove? }: ElementWatchCallbacks, options?: ElementWatchOptions): Disposer
observekit.selector(selector: string, callback: (els: Element[]) => void, options?: ElementWatchOptions): Disposer

observekit.attribute(target: Element | Element[], attrs: string[] | null, callback: (els: Element[]) => void, options?: ScopedOptions): Disposer
observekit.children(target: Element | Element[], callback: (els: Element[]) => void, options?: ScopedOptions): Disposer
observekit.text(target: Element | Element[], callback: (els: Element[]) => void, options?: ScopedOptions): Disposer

observekit.resize(target: Element | Element[], callback: (els: Element[]) => void, options?: BaseOptions): Disposer
observekit.visible(target: Element | Element[], callback: (els: Element[]) => void, options?: VisibleOptions): Disposer

observekit.performance(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void, options?: BaseOptions): Disposer
observekit.reporting(callback: (reports) => void, options?: ReportingOptions): Disposer

observekit({ mutation?, resize?, intersection?, performance? }): Disposer
```

## Options

### `BaseOptions` (every method)

| Option | Type | Default | Effect |
|---|---|---|---|
| `signal` | `AbortSignal` | — | disconnect on abort |
| `once` | `boolean` | `false` | disconnect after first callback |
| `debounce` | `number` (ms) | — | coalesce native firings into one batched call |
| `timeout` | `number` (ms) | — | disconnect if idle this long |
| `onConnect` | `() => void` | — | fires on registration |
| `onDisconnect` | `() => void` | — | fires on disconnect |

### `ScopedOptions extends BaseOptions` (`attribute`, `children`, `text`)

| Option | Type | Default | Effect |
|---|---|---|---|
| `root` | `Element \| Document` | `document` | scopes the shared `MutationObserver` |

### `ElementWatchOptions extends ScopedOptions` (`element`, `selector`)

| Option | Type | Default | Effect |
|---|---|---|---|
| `existing` | `boolean` | `true` | fire `add` immediately for elements already in the DOM |
| `fireOnAttributesModification` | `boolean` | `false` | re-fire `add` when a matched element's attributes change |

### `VisibleOptions extends BaseOptions` (`visible`)

| Option | Type | Default |
|---|---|---|
| `root` | `Element \| Document \| null` | `null` |
| `rootMargin` | `string` | native default |
| `threshold` | `number \| number[]` | native default |

### `ReportingOptions extends BaseOptions` (`reporting`)

| Option | Type |
|---|---|
| `types` | `string[]` |
| `buffered` | `boolean` |

## Callback batching

Every callback receives an array, never a single element — one call per native tick, not one per element:

```ts
(elements: Element[]) => void          // element/selector/attribute/children/text/resize/visible
(entries: PerformanceEntry[]) => void  // performance
```

## Feature detection

`resize`, `visible`, `performance`, `reporting` no-op (`{ disconnect() {} }`, callback never called) when the underlying native observer is unsupported. No polyfills.

## jQuery

Pass `$(...).toArray()` or `$(...).get()` wherever `Element | Element[]` is expected. See README "With jQuery".

## Architecture note

One `MutationObserver` per `root` is shared across every `element`/`selector`/`attribute`/`children`/`text` watcher registered on it — registering more selectors doesn't add native observers.