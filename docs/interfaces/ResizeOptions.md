[**observekit**](../README.md)

***

[observekit](../globals.md) / ResizeOptions

# Interface: ResizeOptions

Defined in: [resize.ts:6](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L6)

Options for `resize()`, adding resize-gesture start/end tracking on top of the base options.

## Extends

- [`BaseOptions`](BaseOptions.md)

## Properties

### debounce?

> `optional` **debounce?**: `number`

Defined in: [types.ts:17](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L17)

Coalesce rapid native callback fires into a single batch, ms.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`debounce`](BaseOptions.md#debounce)

***

### idle?

> `optional` **idle?**: `number`

Defined in: [resize.ts:12](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L12)

Gap, ms, of silence before a gesture counts as ended. Default 200.

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

### onEnd?

> `optional` **onEnd?**: [`ElementsCallback`](../type-aliases/ElementsCallback.md)\<`ResizeObserverEntry`\>

Defined in: [resize.ts:10](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L10)

Fires once when a resize gesture ends (no entries for `idle` ms).

***

### onStart?

> `optional` **onStart?**: [`ElementsCallback`](../type-aliases/ElementsCallback.md)\<`ResizeObserverEntry`\>

Defined in: [resize.ts:8](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/resize.ts#L8)

Fires once when a resize gesture begins (first entries after idle).

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
