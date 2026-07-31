# observekit

Unified, typed, tree-shakeable wrapper over the browser's native Observer
APIs — `MutationObserver`, `ResizeObserver`, `IntersectionObserver`,
`PerformanceObserver`, and `ReportingObserver`. Built to replace
`arrive.js`-style polling/mutation hacks in browser extensions and content
scripts with something fast and typed.

Zero runtime dependencies. ESM + CJS. `sideEffects: false`.

```bash
npm install observekit
```

## Why

- **Batched, not per-element.** Every callback receives an array for the
  whole native batch — never one synchronous call per matched element.
- **O(1) native observers.** Registering k selectors or n targets never
  spins up k or n raw `MutationObserver`/`ResizeObserver`/
  `IntersectionObserver` instances — one shared observer does the work.
- **One DOM walk per mutation batch**, not one `querySelectorAll` per
  registered selector.
- Fully typed, no `any`.

## Quick start

```ts
import { observekit } from 'observekit';

const stop = observekit.selector('.toast', (toasts) => {
  toasts.forEach((el) => el.classList.add('animate-in'));
});

// later
stop.disconnect();
```

## API

| Method | Wraps | Signature |
| --- | --- | --- |
| `observekit.element` | `MutationObserver` | `(selector, callback, options?) => Disposer` |
| `observekit.selector` | `MutationObserver` | alias for `element` |
| `observekit.attribute` | `MutationObserver` | `(target \| target[], attrs, callback, options?) => Disposer` |
| `observekit.children` | `MutationObserver` | `(target \| target[], callback, options?) => Disposer` |
| `observekit.text` | `MutationObserver` | `(target \| target[], callback, options?) => Disposer` |
| `observekit.resize` | `ResizeObserver` | `(target \| target[], callback, options?) => Disposer` |
| `observekit.visible` | `IntersectionObserver` | `(target \| target[], callback, options?) => Disposer` |
| `observekit.performance` | `PerformanceObserver` | `(entryTypes, callback, options?) => Disposer` |
| `observekit.reports` | `ReportingObserver` | `(types, callback, options?) => Disposer` (feature-detected, no-op if unsupported) |

Every method returns a `Disposer`: `{ disconnect(): void }`.

`observekit({ mutation, resize, intersection, performance })` is also
available as a declarative convenience form that just invokes the callbacks
you pass it — prefer the named methods above for real, tree-shakeable usage.

### Callback shapes

`element`/`selector`/`attribute`/`children`/`text` deliver `Element[]`.
`resize` delivers `ResizeObserverEntry[]`, `visible` delivers
`IntersectionObserverEntry[]`, `performance` delivers `PerformanceEntry[]` —
richer than a bare element list, but always **an array for the whole
batch**, never one call per item.

### Shared options (`BaseOptions`)

| Option | Type | Description |
| --- | --- | --- |
| `signal` | `AbortSignal` | Disconnect via `AbortController`. |
| `once` | `boolean` | Auto-disconnect after the first delivered batch. |
| `debounce` | `number` (ms) | Coalesce rapid fires into one batch. One timer per watcher, not per element. |
| `timeout` | `number` (ms) | Auto-disconnect if nothing has matched yet. |
| `onConnect` / `onDisconnect` | `() => void` | Lifecycle hooks. |

### `element`/`selector`-only options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `root` | `Element \| Document` | `document` | Scope to observe. |
| `existing` | `boolean` | `true` | Fire immediately for elements already matching on registration. |
| `fireOnAttributesModification` | `boolean` | `false` | Re-fire for a matched element when its attributes change, not just on insertion. |

## Examples

### `element` / `selector` — arrive.js-style

```ts
observekit.element('.lazy-img', (imgs) => {
  imgs.forEach((img) => (img.src = img.dataset.src!));
});

// two-callback form
observekit.selector('.card', {
  add: (cards) => cards.forEach((c) => c.classList.add('mounted')),
  remove: (cards) => cards.forEach((c) => console.log('unmounted', c)),
});
```

### `attribute`

```ts
observekit.attribute(themeToggleEl, ['data-theme'], (els) => {
  console.log('theme changed on', els);
});
```

### `children`

```ts
observekit.children(document.querySelector('#feed')!, (changed) => {
  console.log(`${changed.length} feed items changed`);
});
```

### `text`

```ts
observekit.text(document.querySelector('#counter')!, (els) => {
  console.log('counter updated to', els[0].textContent);
});
```

### `resize`

```ts
observekit.resize([sidebar, main], (entries) => {
  entries.forEach((e) => console.log(e.target, e.contentRect.width));
});
```

### `visible`

```ts
observekit.visible(images, (entries) => {
  entries.filter((e) => e.isIntersecting).forEach((e) => loadImage(e.target as HTMLImageElement));
}, { threshold: 0.1 });
```

### `performance`

```ts
observekit.performance(['largest-contentful-paint'], (entries) => {
  console.log('LCP', entries.at(-1)?.startTime);
});
```

### `reports`

```ts
observekit.reports(['deprecation', 'intervention'], (reports) => {
  reports.forEach((r) => console.warn(r.type, r.body));
});
```

### Options

```ts
observekit.selector('.modal', (els) => els.forEach(openModal), {
  once: true,
  timeout: 5000,
  signal: controller.signal,
});
```

## Performance design & Big-O

- **One `MutationObserver` per root.** `element`, `selector`, `attribute`,
  `children`, and `text` watchers registered against the same `root` (default
  `document`) all multiplex off a single native `MutationObserver` instance.
  Registering the k-th selector/watcher adds **zero** new native observers
  and **O(1)** amortized JS-side bookkeeping (one `Set`/`Map` entry).
- **One walk per batch.** On each native callback tick, `addedNodes`/
  `removedNodes` are walked exactly once via `querySelectorAll('*')` per
  added/removed node (not per selector). Each collected element is then
  tested against every registered selector with `.matches()`.
  **Cost = O(batch size × selector count)**, with zero extra
  `querySelectorAll` calls per selector.
- **`resize`/`visible`: O(1) native observers per call.** Passing n targets
  to a single `resize()`/`visible()` call creates exactly one
  `ResizeObserver`/`IntersectionObserver` and calls `.observe()` n times —
  never n separate native observers.
- **Batching, not fan-out.** Native observers already batch entries per
  tick; observekit never re-splits a batch into per-element synchronous
  callback invocations. Watchers firing multiple times within the same
  native tick (e.g. several targets changing in one `MutationObserver`
  callback) are coalesced into a single delivered array via a microtask
  flush, even without an explicit `debounce`.
- **Debounce is batch-level.** `debounce` uses one timer per watcher, and
  merges everything pushed during the window into one array — never one
  timer per matched element.
- **Documented tradeoff:** the shared per-root `MutationObserver` observes
  with `{ childList: true, subtree: true, attributes: true, characterData:
  true }` unconditionally, so that adding/removing watchers never requires
  tearing down and re-calling `observe()` with different native options.
  Filtering (which selector matched, which attribute changed) happens in JS.
  This trades a small amount of native observer overhead for O(1) watcher
  registration/deregistration cost and zero re-`observe()` churn.

## More docs

- [`docs/jquery.md`](docs/jquery.md) — using observekit with jQuery collections.
- [`example/index.html`](example/index.html) — live demo of every method, each with a Replay button. Run `npm run build` then open the file (imports from `../dist/index.js`).

## Non-goals

- No polyfills — unsupported observers (e.g. `ReportingObserver` in most
  non-Chromium browsers) feature-detect to a no-op `Disposer`.
- No framework bindings (React/Vue adapters can be a separate package).
- No custom CSS selector engine — `element`/`selector` use native
  `matches()`/`querySelectorAll()` only.

## License

MIT
