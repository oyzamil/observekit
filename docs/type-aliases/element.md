[**observekit**](../README.md)

***

[observekit](../globals.md) / element

# Type Alias: element

> **element** = (`selector`, `callback`, `options`) => [`Disposer`](../interfaces/Disposer.md)

Defined in: [element.ts:35](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/element.ts#L35)

Watches `root` (default `document`) for elements matching `selector`
being added to or removed from the DOM, arrive.js-style. Also available
as the `selector()` alias.

## Parameters

### selector

`string`

CSS selector to match against added/removed elements.

### callback

[`ElementCallback`](ElementCallback.md)

Either a single function (treated as the "add"
callback) or a `{ add, remove }` pair.

### options?

[`ElementOptions`](../interfaces/ElementOptions.md) = `{}`

Element watcher options, including `root`, `existing`,
`text`, and `fireOnAttributesModification`, plus the shared base options.

## Returns

[`Disposer`](../interfaces/Disposer.md)

A `Disposer`; call `.disconnect()` to stop watching.
