[**observekit**](../README.md)

***

[observekit](../globals.md) / observekitFn

# Function: observekitFn()

> **observekitFn**(`config`): [`Disposer`](../interfaces/Disposer.md)

Defined in: [index.ts:54](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L54)

Calling `observekit({...})` is a no-op convenience form for consumers who
want a single declarative entry point; prefer the named, tree-shakeable
`observekit.*` methods below for real usage.

## Parameters

### config

[`ObserveKitConfig`](../interfaces/ObserveKitConfig.md)

Setup functions to invoke for each requested observer kind.

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer` whose `disconnect()` is a no-op.
