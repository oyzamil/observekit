[**observekit**](../README.md)

***

[observekit](../globals.md) / ObserveKitConfig

# Interface: ObserveKitConfig

Defined in: [index.ts:39](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L39)

Declarative config accepted by the `observekit(config)` call form. Each
key is a no-arg setup function the caller provides; ObserveKit simply
invokes whichever ones are present.

## Properties

### intersection?

> `optional` **intersection?**: () => `void`

Defined in: [index.ts:42](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L42)

#### Returns

`void`

***

### mutation?

> `optional` **mutation?**: () => `void`

Defined in: [index.ts:40](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L40)

#### Returns

`void`

***

### performance?

> `optional` **performance?**: () => `void`

Defined in: [index.ts:43](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L43)

#### Returns

`void`

***

### resize?

> `optional` **resize?**: () => `void`

Defined in: [index.ts:41](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/index.ts#L41)

#### Returns

`void`
