/* observekit v0.0.4 - esm | M.Muzammil <https://muzammil.work/> | MIT License */

// src/util.ts
function normalizeText(s) {
  return s.replace(/\s+/g, " ").trim();
}
function matchesText(el, matcher) {
  const text2 = normalizeText(el.textContent ?? "");
  if (typeof matcher === "string") return text2 === matcher;
  if (matcher instanceof RegExp) return matcher.test(text2);
  return matcher(text2);
}
function createBatcher(deliver, ms) {
  let buffer = [];
  let timer;
  let microtaskScheduled = false;
  function flush() {
    timer = void 0;
    microtaskScheduled = false;
    if (!buffer.length) return;
    const out = buffer;
    buffer = [];
    deliver(out);
  }
  return {
    /** Queue items for delivery; empty arrays are ignored. */
    push(items) {
      if (!items.length) return;
      buffer.push(...items);
      if (ms) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(flush, ms);
      } else if (!microtaskScheduled) {
        microtaskScheduled = true;
        queueMicrotask(flush);
      }
    },
    /** Cancel any pending timer/microtask flush and discard buffered items. */
    clear() {
      if (timer) clearTimeout(timer);
      timer = void 0;
      microtaskScheduled = false;
      buffer = [];
    }
  };
}
function createLifecycle(options, onDisconnect) {
  let disconnected = false;
  let timeoutId;
  function disconnect() {
    if (disconnected) return;
    disconnected = true;
    if (timeoutId) clearTimeout(timeoutId);
    onDisconnect();
    options?.onDisconnect?.();
  }
  if (options?.timeout) {
    timeoutId = setTimeout(disconnect, options.timeout);
  }
  if (options?.signal) {
    if (options.signal.aborted) {
      queueMicrotask(disconnect);
    } else {
      options.signal.addEventListener("abort", disconnect, { once: true });
    }
  }
  options?.onConnect?.();
  return {
    disconnect,
    disconnected: () => disconnected,
    markFired() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = void 0;
      }
      if (options?.once) disconnect();
    }
  };
}
function collectElements(node, into) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node;
  into.push(el);
  const descendants = el.querySelectorAll("*");
  descendants.forEach((d) => into.push(d));
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

// src/mutation-registry.ts
var roots = /* @__PURE__ */ new Map();
function getOrCreateEntry(root) {
  let entry = roots.get(root);
  if (entry) return entry;
  const elementWatchers = /* @__PURE__ */ new Set();
  const targetWatchers = /* @__PURE__ */ new Map();
  const observer = new MutationObserver(
    (mutations) => handleMutations(entry, mutations)
  );
  entry = { observer, elementWatchers, targetWatchers };
  roots.set(root, entry);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  return entry;
}
function maybeTeardown(root, entry) {
  if (entry.elementWatchers.size === 0 && entry.targetWatchers.size === 0) {
    entry.observer.disconnect();
    roots.delete(root);
  }
}
function registerElementWatcher(root, watcher) {
  const entry = getOrCreateEntry(root);
  entry.elementWatchers.add(watcher);
  return () => {
    entry.elementWatchers.delete(watcher);
    maybeTeardown(root, entry);
  };
}
function registerTargetWatcher(root, target, watcher) {
  const entry = getOrCreateEntry(root);
  let set = entry.targetWatchers.get(target);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    entry.targetWatchers.set(target, set);
  }
  set.add(watcher);
  return () => {
    const s = entry.targetWatchers.get(target);
    if (!s) return;
    s.delete(watcher);
    if (s.size === 0) entry.targetWatchers.delete(target);
    maybeTeardown(root, entry);
  };
}
function handleMutations(entry, mutations) {
  const hasElementWatchers = entry.elementWatchers.size > 0;
  const hasTargetWatchers = entry.targetWatchers.size > 0;
  if (!hasElementWatchers && !hasTargetWatchers) return;
  const addedEls = [];
  const removedEls = [];
  const attrTargets = /* @__PURE__ */ new Map();
  const childListTargets = /* @__PURE__ */ new Map();
  const textTargets = /* @__PURE__ */ new Set();
  for (const m of mutations) {
    if (m.type === "childList") {
      if (hasElementWatchers) {
        m.addedNodes.forEach((n) => collectElements(n, addedEls));
        m.removedNodes.forEach((n) => collectElements(n, removedEls));
      }
      if (hasTargetWatchers && m.target.nodeType === Node.ELEMENT_NODE) {
        const targetEl = m.target;
        if (entry.targetWatchers.has(targetEl)) {
          let list = childListTargets.get(targetEl);
          if (!list) {
            list = [];
            childListTargets.set(targetEl, list);
          }
          m.addedNodes.forEach(
            (n) => n.nodeType === Node.ELEMENT_NODE && list.push(n)
          );
          m.removedNodes.forEach(
            (n) => n.nodeType === Node.ELEMENT_NODE && list.push(n)
          );
        }
      }
    } else if (m.type === "attributes") {
      const targetEl = m.target;
      let names = attrTargets.get(targetEl);
      if (!names) {
        names = /* @__PURE__ */ new Set();
        attrTargets.set(targetEl, names);
      }
      if (m.attributeName) names.add(m.attributeName);
    } else if (m.type === "characterData") {
      const parent = m.target.parentElement;
      if (parent) textTargets.add(parent);
    }
  }
  if (hasElementWatchers)
    dispatchElementWatchers(entry, addedEls, removedEls, attrTargets);
  if (hasTargetWatchers)
    dispatchTargetWatchers(entry, attrTargets, childListTargets, textTargets);
}
function dispatchElementWatchers(entry, addedEls, removedEls, attrTargets) {
  for (const w of entry.elementWatchers) {
    if (addedEls.length && w.onAdd) {
      let matched = addedEls.filter((el) => el.matches(w.selector));
      if (w.textMatcher) {
        const tm = w.textMatcher;
        matched = matched.filter((el) => matchesText(el, tm));
      }
      if (matched.length) {
        matched.forEach((el) => w.matched.add(el));
        w.onAdd(matched);
      }
    }
    if (removedEls.length && w.onRemove) {
      const matched = removedEls.filter(
        (el) => w.matched.has(el) || !w.textMatcher && el.matches(w.selector)
      );
      if (matched.length) {
        matched.forEach((el) => w.matched.delete(el));
        w.onRemove(matched);
      }
    }
    if (w.fireOnAttributesModification && attrTargets.size && w.onAdd) {
      const refired = [];
      attrTargets.forEach((_names, el) => {
        if (w.matched.has(el) && el.matches(w.selector)) refired.push(el);
      });
      if (refired.length) w.onAdd(refired);
    }
  }
}
function dispatchTargetWatchers(entry, attrTargets, childListTargets, textTargets) {
  attrTargets.forEach((names, target) => {
    const watchers = entry.targetWatchers.get(target);
    if (!watchers) return;
    for (const w of watchers) {
      if (w.kind !== "attribute") continue;
      if (w.attrs && w.attrs.length > 0) {
        const hit = w.attrs.some((a) => names.has(a));
        if (!hit) continue;
      }
      w.onFire([target]);
    }
  });
  childListTargets.forEach((changed, target) => {
    const watchers = entry.targetWatchers.get(target);
    if (!watchers) return;
    for (const w of watchers) {
      if (w.kind !== "children") continue;
      w.onFire(changed);
    }
  });
  textTargets.forEach((target) => {
    const watchers = entry.targetWatchers.get(target);
    if (!watchers) return;
    for (const w of watchers) {
      if (w.kind !== "text") continue;
      w.onFire([target]);
    }
  });
}

// src/attribute.ts
function attribute(targets, attrs, callback, options = {}) {
  const list = toArray(targets);
  const batcher = createBatcher((items) => {
    callback(items);
    lifecycle.markFired();
  }, options.debounce);
  const lifecycle = createLifecycle(
    options,
    () => unregisterAll.forEach((fn) => fn())
  );
  const unregisterAll = list.map(
    (target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
      kind: "attribute",
      attrs,
      onFire: (els) => batcher.push(els)
    })
  );
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/children.ts
function children(targets, callback, options = {}) {
  const list = toArray(targets);
  const batcher = createBatcher((items) => {
    callback(items);
    lifecycle.markFired();
  }, options.debounce);
  const lifecycle = createLifecycle(
    options,
    () => unregisterAll.forEach((fn) => fn())
  );
  const unregisterAll = list.map(
    (target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
      kind: "children",
      onFire: (els) => batcher.push(els)
    })
  );
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/element.ts
function normalizeCallback(cb) {
  if (typeof cb === "function") return { onAdd: cb };
  return { onAdd: cb.add, onRemove: cb.remove };
}
function element(selector2, callback, options = {}) {
  const root = options.root ?? document;
  const { onAdd, onRemove } = normalizeCallback(callback);
  const lifecycle = createLifecycle(options, () => unregister());
  const addBatcher = createBatcher((items) => {
    onAdd?.(items);
    lifecycle.markFired();
  }, options.debounce);
  const removeBatcher = createBatcher((items) => {
    onRemove?.(items);
  }, options.debounce);
  const watcher = {
    selector: selector2,
    textMatcher: options.text,
    fireOnAttributesModification: options.fireOnAttributesModification ?? false,
    matched: /* @__PURE__ */ new Set(),
    onAdd: onAdd ? (els) => addBatcher.push(els) : void 0,
    onRemove: onRemove ? (els) => removeBatcher.push(els) : void 0
  };
  const unregister = registerElementWatcher(root, watcher);
  const existing = options.existing ?? true;
  if (existing && !lifecycle.disconnected()) {
    const scanRoot = root;
    let preexisting = Array.from(scanRoot.querySelectorAll(selector2));
    if (options.text) {
      const tm = options.text;
      preexisting = preexisting.filter((el) => matchesText(el, tm));
    }
    if (preexisting.length) {
      preexisting.forEach((el) => watcher.matched.add(el));
      onAdd?.(preexisting);
      lifecycle.markFired();
    }
  }
  return {
    disconnect() {
      addBatcher.clear();
      removeBatcher.clear();
      lifecycle.disconnect();
    }
  };
}
var selector = element;

// src/intersection.ts
function visible(targets, callback, options = {}) {
  const list = toArray(targets);
  if (typeof IntersectionObserver === "undefined") {
    return { disconnect() {
    } };
  }
  const batcher = createBatcher((entries) => {
    callback(entries);
    lifecycle.markFired();
  }, options.debounce);
  const rootMargin = options.rootMargin ?? (options.offset != null ? typeof options.offset === "number" ? `${options.offset}px` : options.offset : void 0);
  const observer = new IntersectionObserver(
    (entries) => batcher.push(entries),
    {
      root: options.root,
      rootMargin,
      threshold: options.threshold
    }
  );
  const lifecycle = createLifecycle(options, () => observer.disconnect());
  list.forEach((target) => observer.observe(target));
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/performance.ts
function performance_(entryTypes, callback, options = {}) {
  if (typeof PerformanceObserver === "undefined") {
    return { disconnect() {
    } };
  }
  const batcher = createBatcher((entries) => {
    callback(entries);
    lifecycle.markFired();
  }, options.debounce);
  const observer = new PerformanceObserver(
    (list) => batcher.push(list.getEntries())
  );
  const lifecycle = createLifecycle(options, () => observer.disconnect());
  if (entryTypes.length === 1) {
    observer.observe({
      type: entryTypes[0],
      buffered: options.buffered ?? true
    });
  } else {
    observer.observe({ entryTypes });
  }
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/reporting.ts
function reports(types, callback, options = {}) {
  const Ctor = globalThis.ReportingObserver;
  if (!Ctor) {
    return { disconnect() {
    } };
  }
  const batcher = createBatcher((items) => {
    callback(items);
    lifecycle.markFired();
  }, options.debounce);
  const observer = new Ctor((list) => batcher.push(list), {
    types,
    buffered: true
  });
  const lifecycle = createLifecycle(options, () => observer.disconnect());
  observer.observe();
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/resize.ts
function resize(targets, callback, options = {}) {
  const list = toArray(targets);
  if (typeof ResizeObserver === "undefined") {
    return { disconnect() {
    } };
  }
  const batcher = createBatcher((entries) => {
    callback(entries);
    lifecycle.markFired();
  }, options.debounce);
  const idleMs = options.idle ?? 200;
  let sessionActive = false;
  let idleTimer;
  const latest = /* @__PURE__ */ new Map();
  function endSession() {
    idleTimer = void 0;
    if (!sessionActive) return;
    sessionActive = false;
    const entries = Array.from(latest.values());
    latest.clear();
    if (entries.length) options.onEnd?.(entries);
  }
  const observer = new ResizeObserver((entries) => {
    if (!sessionActive) {
      sessionActive = true;
      options.onStart?.(entries);
    }
    entries.forEach((e) => latest.set(e.target, e));
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(endSession, idleMs);
    batcher.push(entries);
  });
  const lifecycle = createLifecycle(options, () => {
    observer.disconnect();
    if (idleTimer) clearTimeout(idleTimer);
  });
  list.forEach((target) => observer.observe(target));
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}
resize.start = function start(targets, callback, options = {}) {
  return resize(targets, () => {
  }, { ...options, onStart: callback });
};
resize.end = function end(targets, callback, options = {}) {
  return resize(targets, () => {
  }, { ...options, onEnd: callback });
};

// src/text.ts
function text(targets, callback, options = {}) {
  const list = toArray(targets);
  const batcher = createBatcher((items) => {
    callback(items);
    lifecycle.markFired();
  }, options.debounce);
  const lifecycle = createLifecycle(
    options,
    () => unregisterAll.forEach((fn) => fn())
  );
  const unregisterAll = list.map(
    (target) => registerTargetWatcher(target.ownerDocument ?? document, target, {
      kind: "text",
      onFire: (els) => batcher.push(els)
    })
  );
  return {
    disconnect() {
      batcher.clear();
      lifecycle.disconnect();
    }
  };
}

// src/index.ts
function observekitFn(config) {
  config.mutation?.();
  config.resize?.();
  config.intersection?.();
  config.performance?.();
  return { disconnect() {
  } };
}
var observekit = Object.assign(observekitFn, {
  element,
  selector,
  attribute,
  children,
  text,
  resize,
  visible,
  performance: performance_,
  reports
});
var src_default = observekit;
export {
  src_default as default,
  observekit
};
//# sourceMappingURL=observekit.esm.js.map