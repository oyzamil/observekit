[**observekit**](../README.md)

***

[observekit](../globals.md) / TextMatcher

# Type Alias: TextMatcher

> **TextMatcher** = `string` \| `RegExp` \| ((`text`) => `boolean`)

Defined in: [types.ts:61](https://github.com/oyzamil/observekit/blob/b1a68a7e8637c8c167cac54ff32024dadbda4bea/src/types.ts#L61)

Matches an element's normalized (whitespace-collapsed, trimmed)
textContent. String = exact match; RegExp = tested against the
normalized text; function = custom predicate.
