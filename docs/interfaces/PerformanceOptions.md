[**observekit**](../README.md)

***

[observekit](../globals.md) / PerformanceOptions

# Interface: PerformanceOptions

Defined in: [performance.ts:6](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/performance.ts#L6)

Options for `performance_()`, layered on top of `PerformanceObserver` init options.

## Extends

- [`BaseOptions`](BaseOptions.md)

## Properties

### buffered?

> `optional` **buffered?**: `boolean`

Defined in: [performance.ts:8](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/performance.ts#L8)

Include performance entries recorded before this observer was created. Defaults to `true`.

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [types.ts:17](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L17)

Coalesce rapid native callback fires into a single batch, ms.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`debounce`](BaseOptions.md#debounce)

***

### once?

> `optional` **once?**: `boolean`

Defined in: [types.ts:15](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L15)

Auto-disconnect after the first delivered batch.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`once`](BaseOptions.md#once)

***

### onConnect?

> `optional` **onConnect?**: () => `void`

Defined in: [types.ts:21](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L21)

Called synchronously once the watcher is registered.

#### Returns

`void`

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`onConnect`](BaseOptions.md#onconnect)

***

### onDisconnect?

> `optional` **onDisconnect?**: () => `void`

Defined in: [types.ts:23](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L23)

Called once, when the watcher disconnects (manually, once, timeout, or signal abort).

#### Returns

`void`

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`onDisconnect`](BaseOptions.md#ondisconnect)

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [types.ts:13](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L13)

Disconnect the watcher when this signal aborts.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`signal`](BaseOptions.md#signal)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types.ts:19](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L19)

Auto-disconnect after this many ms if nothing has matched yet.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`timeout`](BaseOptions.md#timeout)
