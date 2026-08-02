[**observekit**](../README.md)

***

[observekit](../globals.md) / BaseOptions

# Interface: BaseOptions

Defined in: [types.ts:11](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L11)

Options shared by every observekit.* watcher.

## Extended by

- [`VisibleOptions`](VisibleOptions.md)
- [`PerformanceOptions`](PerformanceOptions.md)
- [`ResizeOptions`](ResizeOptions.md)
- [`ElementOptions`](ElementOptions.md)

## Properties

### debounce?

> `optional` **debounce?**: `number`

Defined in: [types.ts:17](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L17)

Coalesce rapid native callback fires into a single batch, ms.

***

### once?

> `optional` **once?**: `boolean`

Defined in: [types.ts:15](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L15)

Auto-disconnect after the first delivered batch.

***

### onConnect?

> `optional` **onConnect?**: () => `void`

Defined in: [types.ts:21](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L21)

Called synchronously once the watcher is registered.

#### Returns

`void`

***

### onDisconnect?

> `optional` **onDisconnect?**: () => `void`

Defined in: [types.ts:23](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L23)

Called once, when the watcher disconnects (manually, once, timeout, or signal abort).

#### Returns

`void`

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [types.ts:13](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L13)

Disconnect the watcher when this signal aborts.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types.ts:19](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L19)

Auto-disconnect after this many ms if nothing has matched yet.
