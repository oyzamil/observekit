[**observekit**](../README.md)

***

[observekit](../globals.md) / visible

# Type Alias: visible

> **visible** = (`targets`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [intersection.ts:32](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L32)

One IntersectionObserver per call, `.observe()` invoked once per target -
O(1) native observers regardless of how many targets are passed.

## Parameters

### targets

`Element` \| `Element`[]

A single element or array of elements to observe.

### callback

[`ElementsCallback`](ElementsCallback.md)\<`IntersectionObserverEntry`\>

Invoked with the batch of `IntersectionObserverEntry`
records delivered by the native observer.

### options?

[`VisibleOptions`](../interfaces/VisibleOptions.md) = `{}`

`VisibleOptions`, including `root`, `rootMargin`,
`threshold`, `offset`, plus the shared base options.

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop observing. Resolves
to a no-op disposer in environments without `IntersectionObserver`.
