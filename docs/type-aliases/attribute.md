[**observekit**](../README.md)

***

[observekit](../globals.md) / attribute

# Type Alias: attribute

> **attribute** = (`targets`, `attrs`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [attribute.ts:18](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/attribute.ts#L18)

Watches one or more specific elements for changes to the given
attribute(s), firing `callback` with the affected element(s) whenever any
of them change.

## Parameters

### targets

`Element` \| `Element`[]

A single element or array of elements to watch.

### attrs

`string`[]

Attribute names to react to (e.g. `["class", "disabled"]`).

### callback

[`ElementsCallback`](ElementsCallback.md)

Invoked with the batch of elements whose watched
attribute(s) changed.

### options?

[`BaseOptions`](../interfaces/BaseOptions.md) = `{}`

Shared watcher options (debounce, once, timeout, etc.).

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop watching.
