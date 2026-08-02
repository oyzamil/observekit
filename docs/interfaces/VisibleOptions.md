[**observekit**](../README.md)

***

[observekit](../globals.md) / VisibleOptions

# Interface: VisibleOptions

Defined in: [intersection.ts:6](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L6)

Options for `visible()`, layered on top of `IntersectionObserver` init options.

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

### offset?

> `optional` **offset?**: `string` \| `number`

Defined in: [intersection.ts:17](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L17)

Convenience for expanding the root's bounding box before intersection
triggers, so the callback fires slightly before the element is
actually visible on screen ("near to appear"). A number is treated as
px on all sides; a string is used as-is (same syntax as CSS margin).
Ignored if `rootMargin` is also given.

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

### root?

> `optional` **root?**: `Document` \| `Element` \| `null`

Defined in: [intersection.ts:7](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L7)

***

### rootMargin?

> `optional` **rootMargin?**: `string`

Defined in: [intersection.ts:8](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L8)

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [types.ts:13](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L13)

Disconnect the watcher when this signal aborts.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`signal`](BaseOptions.md#signal)

***

### threshold?

> `optional` **threshold?**: `number` \| `number`[]

Defined in: [intersection.ts:9](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/intersection.ts#L9)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types.ts:19](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L19)

Auto-disconnect after this many ms if nothing has matched yet.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`timeout`](BaseOptions.md#timeout)
