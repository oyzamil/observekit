[**observekit**](../README.md)

***

[observekit](../globals.md) / children

# Type Alias: children

> **children** = (`targets`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [children.ts:16](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/children.ts#L16)

Watches one or more specific elements for direct child list changes
(elements added to or removed from the target), firing `callback` with
the affected child element(s).

## Parameters

### targets

`Element` \| `Element`[]

A single element or array of elements to watch.

### callback

[`ElementsCallback`](ElementsCallback.md)

Invoked with the batch of added/removed child elements.

### options?

[`BaseOptions`](../interfaces/BaseOptions.md) = `{}`

Shared watcher options (debounce, once, timeout, etc.).

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop watching.
