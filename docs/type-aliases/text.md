[**observekit**](../README.md)

***

[observekit](../globals.md) / text

# Type Alias: text

> **text** = (`targets`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [text.ts:16](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/text.ts#L16)

Watches one or more specific elements for changes to their text content
(via `characterData` mutations on descendant text nodes), firing
`callback` with the target element(s) whose text changed.

## Parameters

### targets

`Element` \| `Element`[]

A single element or array of elements to watch.

### callback

[`ElementsCallback`](ElementsCallback.md)

Invoked with the batch of elements whose text changed.

### options?

[`BaseOptions`](../interfaces/BaseOptions.md) = `{}`

Shared watcher options (debounce, once, timeout, etc.).

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop watching.
