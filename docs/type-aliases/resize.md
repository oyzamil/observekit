[**observekit**](../README.md)

***

[observekit](../globals.md) / resize

# Type Alias: resize

> **resize** = *typeof* [`resize`](../observekit/namespaces/resize/README.md)

Defined in: [resize.ts:27](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L27)

One ResizeObserver per call, `.observe()` invoked once per target -
O(1) native observers regardless of how many targets are passed.

## Param

**targets**

A single element or array of elements to observe.

## Param

**callback**

Invoked with every batch of `ResizeObserverEntry`
records delivered by the native observer.

## Param

**options**

`ResizeOptions`, including `onStart`, `onEnd`, `idle`,
plus the shared base options.

## Returns

A `Disposer`; call `.disconnect()` to stop observing. Resolves
to a no-op disposer in environments without `ResizeObserver`.
