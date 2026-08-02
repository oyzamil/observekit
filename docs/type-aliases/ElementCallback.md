[**observekit**](../README.md)

***

[observekit](../globals.md) / ElementCallback

# Type Alias: ElementCallback

> **ElementCallback** = [`ElementsCallback`](ElementsCallback.md) \| [`AddRemoveCallbacks`](../interfaces/AddRemoveCallbacks.md)

Defined in: [types.ts:75](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L75)

Callback shape accepted by `element()`/`selector()`: either a single
function (treated as `onAdd`) or an explicit `{ add, remove }` pair.
