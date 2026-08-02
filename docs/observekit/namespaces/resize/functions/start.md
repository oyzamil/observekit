[**observekit**](../../../../README.md)

***

[observekit](../../../../globals.md) / [resize](../README.md) / start

# Function: start()

> **start**(`targets`, `callback`, `options?`): [`Disposer`](../../../../interfaces/Disposer.md)

Defined in: [resize.ts:93](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L93)

## Parameters

### targets

`Element` \| `Element`[]

A single element or array of elements to observe.

### callback

[`ElementsCallback`](../../../../type-aliases/ElementsCallback.md)\<`ResizeObserverEntry`\>

Invoked once per resize gesture, with the entries that
triggered it.

### options?

[`ResizeOptions`](../../../../interfaces/ResizeOptions.md) = `{}`

Same options as `resize()`; `onStart` is set internally.

## Returns

[`Disposer`](../../../../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop observing.
