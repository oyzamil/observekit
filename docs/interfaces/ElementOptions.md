[**observekit**](../README.md)

***

[observekit](../globals.md) / ElementOptions

# Interface: ElementOptions

Defined in: [types.ts:27](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L27)

Options for element/selector watchers.

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

### existing?

> `optional` **existing?**: `boolean`

Defined in: [types.ts:35](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L35)

On registration, immediately scan `root` for elements already matching
the selector and fire the add callback for them before watching future
insertions. Defaults to `true`.

***

### fireOnAttributesModification?

> `optional` **fireOnAttributesModification?**: `boolean`

Defined in: [types.ts:40](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L40)

Re-fire the add callback for an already-matched element when one of its
attributes changes (not just on insertion). Defaults to `false`.

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

> `optional` **root?**: [`Root`](../type-aliases/Root.md)

Defined in: [types.ts:29](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L29)

Scope to observe. Defaults to `document`.

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [types.ts:13](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L13)

Disconnect the watcher when this signal aborts.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`signal`](BaseOptions.md#signal)

***

### text?

> `optional` **text?**: [`TextMatcher`](../type-aliases/TextMatcher.md)

Defined in: [types.ts:47](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L47)

Further restrict matches to elements whose textContent satisfies this
matcher. Applied on top of `selector` — scope `selector` narrowly
(e.g. `'button'`, not `'*'`) so a matching leaf and its matching
ancestor don't both fire for the same text.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [types.ts:19](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L19)

Auto-disconnect after this many ms if nothing has matched yet.

#### Inherited from

[`BaseOptions`](BaseOptions.md).[`timeout`](BaseOptions.md#timeout)
