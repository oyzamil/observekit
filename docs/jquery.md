# observekit + jQuery

observekit works with plain DOM elements. jQuery objects wrap elements —
unwrap with `.get()` or `.toArray()` before passing to observekit, and
re-wrap the returned `Element[]` with `$(...)` inside your callback.

## Selector watching (arrive.js replacement)

```js
observekit.selector('.toast', (els) => {
  $(els).addClass('animate-in');
});
```

Two-callback form:

```js
observekit.selector('.card', {
  add: (els) => $(els).fadeIn(),
  remove: (els) => $(els).remove(),
});
```

## Watching a jQuery collection

Pass `.get()` output (plain array of elements) as the target:

```js
const $items = $('.item');
observekit.attribute($items.get(), ['data-state'], (els) => {
  $(els).each(function () {
    console.log($(this).data('state'));
  });
});
```

Same pattern for `children`, `text`, `resize`, `visible`:

```js
observekit.resize($('.panel').get(), (entries) => {
  entries.forEach((e) => $(e.target).css('--w', e.contentRect.width + 'px'));
});
```

## Root scoping

`root` option accepts a plain element — unwrap jQuery first:

```js
observekit.element('.row', cb, { root: $('#table').get(0) });
```

## Cleanup

Every call returns `{ disconnect() }` — same as `.off()` in jQuery. Store it
and call on teardown:

```js
const watcher = observekit.selector('.modal', onModal);
$(window).on('unload', () => watcher.disconnect());
```

## Why not just `$(document).on('DOMNodeInserted', ...)`

That event is deprecated, fires per-node (no batching), and is slow on
large pages. observekit batches, shares one `MutationObserver`, and gives
you typed `Element[]` arrays instead.
