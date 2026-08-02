[**observekit**](../README.md)

***

[observekit](../globals.md) / Disposer

# Interface: Disposer

Defined in: [types.ts:5](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L5)

Handle returned by every `observekit.*` watcher, used to tear it down.

## Methods

### disconnect()

> **disconnect**(): `void`

Defined in: [types.ts:7](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L7)

Stops the watcher and releases any underlying native observers.

#### Returns

`void`
