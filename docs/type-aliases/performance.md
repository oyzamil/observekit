[**observekit**](../README.md)

***

[observekit](../globals.md) / performance

# Type Alias: performance

> **performance** = (`entryTypes`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [performance.ts:22](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/performance.ts#L22)

Wraps `PerformanceObserver`, batching `PerformanceEntry` records for the
given `entryTypes`.

## Parameters

### entryTypes

`string`[]

Entry types to observe (e.g. `["largest-contentful-paint"]`).

### callback

[`ElementsCallback`](ElementsCallback.md)\<`PerformanceEntry`\>

Invoked with each batch of `PerformanceEntry` records.

### options?

[`PerformanceOptions`](../interfaces/PerformanceOptions.md) = `{}`

`PerformanceOptions`, including `buffered`, plus the
shared base options.

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop observing. Resolves
to a no-op disposer in environments without `PerformanceObserver`.
