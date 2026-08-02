[**observekit**](../README.md)

***

[observekit](../globals.md) / AddRemoveCallbacks

# Interface: AddRemoveCallbacks

Defined in: [types.ts:64](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L64)

Split add/remove callback pair, as accepted by [element](../type-aliases/element.md)'s `callback` param.

## Properties

### add?

> `optional` **add?**: [`ElementsCallback`](../type-aliases/ElementsCallback.md)\<`Element`\>

Defined in: [types.ts:66](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L66)

Called with elements newly matching the selector.

***

### remove?

> `optional` **remove?**: [`ElementsCallback`](../type-aliases/ElementsCallback.md)\<`Element`\>

Defined in: [types.ts:68](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L68)

Called with elements that previously matched but no longer do (e.g. removed from the DOM).
