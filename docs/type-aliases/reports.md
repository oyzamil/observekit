[**observekit**](../README.md)

***

[observekit](../globals.md) / reports

# Type Alias: reports

> **reports** = (`types`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [reporting.ts:40](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/reporting.ts#L40)

Wraps ReportingObserver (deprecation / intervention / crash reports).
Feature-detected: no-ops on browsers without support instead of throwing.

## Parameters

### types

`string`[]

Report types to observe (e.g. `["deprecation", "crash"]`).

### callback

(`reports`) => `void`

Invoked with each batch of reports.

### options?

[`BaseOptions`](../interfaces/BaseOptions.md) = `{}`

Shared watcher options (debounce, once, timeout, etc.).

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop observing. Resolves
to a no-op disposer in environments without `ReportingObserver`.
