/**
 * DOM Event Listener Manager
 *
 * Manages DOM event attachment, cross-browser event normalization, listener
 * wrapping with error reporting, and click delegation utilities.
 *
 * Extracted from YouTube web player base.js (player_es6.vflset/en_US).
 * Source lines: 11972-12078
 * Variable declarations: 66867-66896 (Yn, TDR, Qt7, rsO)
 *
 * @module core/dom-listener
 */

import { BrowserEvent } from "./dom-event.js"; // was: oH3
import { findKey } from "./object-utils.js"; // was: Ga
import { isObject } from "./type-helpers.js"; // was: g.Sd
import { shallowEquals } from "./object-utils.js"; // was: g.hH
import { forEach } from "./array-utils.js"; // was: g.lw
import { hasClass } from "./dom-utils.js"; // was: g.B7
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { defineProperty } from './polyfills.js';

// ---------------------------------------------------------------------------
// Module-level state (global listener registry)
// [was: Yn, TDR]
// Source lines: 66867-66872
// ---------------------------------------------------------------------------

/**
 * Global listener registry -- maps listener keys to registration records.
 * Each record is [element, eventType, originalHandler, wrappedHandler, options].
 * Stored on window as `ytEventsEventsListeners` for cross-module access.
 * @type {Object<string, Array>}
 */
// was: Yn
const listenerRegistry = globalThis.ytEventsEventsListeners || {};

/**
 * Auto-incrementing counter for generating unique listener keys.
 * Stored on window as `ytEventsEventsCounter`.
 * @type {{ count: number }}
 */
// was: TDR
const listenerCounter = globalThis.ytEventsEventsCounter || { count: 0 };

// ---------------------------------------------------------------------------
// Feature detection helpers (memoized)
// [was: Qt7, rsO]
// Source lines: 66873-66896
// ---------------------------------------------------------------------------

/**
 * Memoize a zero-argument function so it only runs once.
 * @param {function(): *} fn [was: Q]
 * @returns {function(): *}
 */
function memoize(fn) { // was: a_
  let called = false; // was: c
  let result; // was: W
  return function () {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}

/**
 * Detect whether the browser supports the `passive` option on addEventListener.
 * @returns {boolean}
 */
const supportsPassiveEvents = memoize(function () { // was: Qt7
  let supported = false; // was: Q
  try {
    const opts = Object.defineProperty({}, "passive", {
      get() {
        supported = true;
      },
    });
    window.addEventListener("test", null, opts);
  } catch (_e) { /* ignored */ }
  return supported;
});

/**
 * Detect whether the browser supports the `capture` option object
 * (as opposed to only the boolean third argument) on addEventListener.
 * @returns {boolean}
 */
const supportsCaptureOption = memoize(function () { // was: rsO
  let supported = false; // was: Q
  try {
    const opts = Object.defineProperty({}, "capture", {
      get() {
        supported = true;
      },
    });
    window.addEventListener("test", null, opts);
  } catch (_e) { /* ignored */ }
  return supported;
});

// ---------------------------------------------------------------------------
// Error-reporting wrapper  [was: g.Ei]
// Source lines: 10963-10972
// ---------------------------------------------------------------------------

/**
 * Wrap a function in a try/catch that reports errors to YouTube's error logger.
 * If `window.yterr` is not present, returns the function unchanged.
 *
 * @param {Function} fn [was: Q]
 * @returns {Function}
 */
export function wrapWithErrorReporter(fn) { // was: g.Ei
  if (!fn || !window.yterr) return fn;
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (e) {
      reportError(e); // was: g.Zp
    }
  };
}

/**
 * Report an error through YouTube's logging pipeline.
 * Falls back to pushing onto the global ERRORS array if the logger
 * is not yet initialised.
 *
 * @param {*} error [was: Q]
 */
function reportError(error) { // was: g.Zp
  const logFn = globalThis.yt?.logging?.errors?.log; // was: g.DR("yt.logging.errors.log")
  if (logFn) {
    logFn(error, "ERROR", undefined, undefined, undefined, undefined, undefined);
  } else {
    const errors = globalThis.ytcfg?.data_?.ERRORS ?? []; // was: g.v("ERRORS", [])
    errors.push([error, "ERROR", undefined, undefined, undefined, undefined, undefined]);
  }
}

// ---------------------------------------------------------------------------
// Scroll position helper  [was: my_]
// Source line: 11972
// ---------------------------------------------------------------------------

/**
 * Compute and store the page-relative (scrolled) coordinates on an event-like object.
 * Sets `event.W` (pageX) and `event.O` (pageY).
 *
 * @param {object} event - An object with `clientX` / `clientY` properties. [was: Q]
 */
export function computePageCoordinates(event) { // was: my_
  if (document.body && document.documentElement) {
    const scrollTop =
      document.body.scrollTop + document.documentElement.scrollTop; // was: c
    event.W =
      event.clientX +
      (document.body.scrollLeft + document.documentElement.scrollLeft);
    event.O = event.clientY + scrollTop;
  }
}

// ---------------------------------------------------------------------------
// Listener lookup  [was: K4y]
// Source lines: 11980-11988
// ---------------------------------------------------------------------------

/**
 * Normalise the event name for cross-browser compatibility, then search
 * the global listener registry for an existing registration that matches
 * the given element + event + handler + options combination.
 *
 * @param {EventTarget} element  [was: Q]
 * @param {string}      eventType [was: c]
 * @param {Function}    handler   [was: W]
 * @param {object|boolean} options [was: m]
 * @returns {string|undefined} The listener key if found, otherwise `undefined`.
 */
function findExistingListener(element, eventType, handler, options = {}) { // was: K4y
  // Normalise event names when addEventListener is available
  if (element.addEventListener) {
    if (eventType !== "mouseenter" || "onmouseenter" in document) {
      if (eventType !== "mouseleave" || "onmouseenter" in document) {
        if (
          eventType === "mousewheel" &&
          "MozBoxSizing" in document.documentElement.style
        ) {
          eventType = "MozMousePixelScroll"; // Firefox pixel-level scroll
        }
      } else {
        eventType = "mouseout";
      }
    } else {
      eventType = "mouseover";
    }
  }

  return findKey(listenerRegistry, (entry) => { // was: Ga(Yn, K => ...)
    const booleanMatch = // was: T
      typeof entry[4] === "boolean" && entry[4] === !!options;
    const objectMatch = // was: r
      isObject(entry[4]) && isObject(options) && shallowEquals(entry[4], options);
    return (
      !!entry.length &&
      entry[0] === element &&
      entry[1] === eventType &&
      entry[2] === handler &&
      (booleanMatch || objectMatch)
    );
  });
}

// ---------------------------------------------------------------------------
// Ancestor walk  [was: Ls]
// Source line: 1709
// ---------------------------------------------------------------------------

/**
 * Walk up the DOM tree from `startNode`, calling `predicate` on each node.
 * Returns the first node for which `predicate` returns truthy, or `null`.
 *
 * @param {Node|null} startNode    [was: Q]
 * @param {function(Node): boolean} predicate [was: c]
 * @param {boolean}   [includeSelf=false] - Whether to test `startNode` itself. [was: W]
 * @returns {Node|null}
 */
export function findAncestor(startNode, predicate, includeSelf = false) { // was: Ls
  if (startNode && !includeSelf) {
    startNode = startNode.parentNode;
  }
  let depth = 0; // was: W (reused)
  while (startNode) {
    if (predicate(startNode)) return startNode;
    startNode = startNode.parentNode;
    depth++;
  }
  return null;
}

// ---------------------------------------------------------------------------
// addEventListener / listen  [was: g.ph]
// Source lines: 11990-12017
// ---------------------------------------------------------------------------

/**
 * Attach a DOM event listener with cross-browser normalisation.
 *
 * - Translates `mouseenter` / `mouseleave` to `mouseover` / `mouseout`
 *   when native mouseenter support is absent.
 * - Translates `mousewheel` to `MozMousePixelScroll` for Firefox.
 * - Wraps the handler with {@link BrowserEvent} construction and
 *   {@link wrapWithErrorReporter} for error logging.
 * - Caches the registration in {@link listenerRegistry} so it can be
 *   cleaned up later with {@link unlisten}.
 *
 * @param {EventTarget} element   - The element to listen on. [was: Q]
 * @param {string}      eventType - The DOM event name. [was: c]
 * @param {Function}    handler   - The user callback. [was: W]
 * @param {object|boolean} [options={}] - addEventListener options or useCapture boolean. [was: m]
 * @returns {string} A unique listener key for later removal.
 */
export function listen(element, eventType, handler, options = {}) { // was: g.ph
  if (!element || (!element.addEventListener && !element.attachEvent)) {
    return "";
  }

  // Return existing key if this exact listener is already registered
  let key = findExistingListener(element, eventType, handler, options); // was: K
  if (key) return key;

  key = ++listenerCounter.count + ""; // was: K

  // Determine whether we need to emulate mouseenter/mouseleave
  const needsMouseEmulation = !( // was: T
    (eventType !== "mouseenter" && eventType !== "mouseleave") ||
    !element.addEventListener ||
    "onmouseenter" in document
  );

  let wrappedHandler; // was: r

  if (needsMouseEmulation) {
    // Emulate mouseenter/mouseleave via mouseover/mouseout + relatedTarget check
    wrappedHandler = (nativeEvent) => { // was: U
      const evt = new BrowserEvent(nativeEvent); // was: U = new oH3(U)
      if (!findAncestor(evt.relatedTarget, (node) => node === element, true)) {
        evt.currentTarget = element;
        evt.type = eventType;
        return handler.call(element, evt);
      }
    };
  } else {
    wrappedHandler = (nativeEvent) => { // was: U
      const evt = new BrowserEvent(nativeEvent);
      evt.currentTarget = element;
      return handler.call(element, evt);
    };
  }

  wrappedHandler = wrapWithErrorReporter(wrappedHandler); // was: r = g.Ei(r)

  if (element.addEventListener) {
    // Normalise event type for actual registration
    if (eventType === "mouseenter" && needsMouseEmulation) {
      eventType = "mouseover";
    } else if (eventType === "mouseleave" && needsMouseEmulation) {
      eventType = "mouseout";
    } else if (
      eventType === "mousewheel" &&
      "MozBoxSizing" in document.documentElement.style
    ) {
      eventType = "MozMousePixelScroll";
    }

    if (supportsCaptureOption() || typeof options === "boolean") {
      element.addEventListener(eventType, wrappedHandler, options);
    } else {
      element.addEventListener(eventType, wrappedHandler, !!options.capture);
    }
  } else {
    // Legacy IE attachEvent path
    element.attachEvent(`on${eventType}`, wrappedHandler);
  }

  listenerRegistry[key] = [element, eventType, handler, wrappedHandler, options];
  return key;
}

// ---------------------------------------------------------------------------
// Click delegation  [was: Uy7, Icy]
// Source lines: 12019-12031
// ---------------------------------------------------------------------------

/**
 * Delegate a click event from `document.body` (or `document`) to descendants
 * matching a given predicate.
 *
 * When a click occurs, the DOM is walked upward from the click target.
 * If a node matching `predicate` is found (and it is not disabled),
 * `handler` is called with that node as `this` and `event.currentTarget`.
 *
 * @param {Function} handler   - Called when a matching element is clicked. [was: Q]
 * @param {function(Element): boolean} predicate - Test whether an element is a delegation target. [was: c]
 * @returns {string} Listener key.
 */
export function delegateClick(handler, predicate) { // was: Uy7
  const root = document.body || document; // was: W
  return listen(root, "click", (event) => { // was: m
    const match = findAncestor( // was: K
      event.target,
      (node) => node === root || predicate(node),
      true,
    );
    if (match && match !== root && !match.disabled) {
      event.currentTarget = match;
      handler.call(match, event);
    }
  });
}

/**
 * Delegate clicks to elements that have the CSS class `ytp-ad-has-logging-urls`.
 *
 * @param {Function} handler [was: Q]
 * @returns {string} Listener key.
 */
export function delegateAdClick(handler) { // was: Icy
  return delegateClick(handler, (createDatabaseDefinition) => hasClass(createDatabaseDefinition, "ytp-ad-has-logging-urls")); // was: g.B7
}

// ---------------------------------------------------------------------------
// unlisten / removeEventListener  [was: g.Qg]
// Source lines: 12033-12047
// ---------------------------------------------------------------------------

/**
 * Remove one or more previously-registered event listeners by key.
 *
 * @param {string|string[]} keys - A single key or array of keys returned by {@link listen}. [was: Q]
 */
export function unlisten(keys) { // was: g.Qg
  if (!keys) return;
  if (typeof keys === "string") keys = [keys];

  forEach(keys, (key) => { // was: g.lw(Q, c => ...)
    if (key in listenerRegistry) {
      const entry = listenerRegistry[key]; // was: W
      const element = entry[0]; // was: m
      const eventType = entry[1]; // was: K
      const wrappedHandler = entry[3]; // was: T
      const options = entry[4]; // was: W (reused)

      if (element.removeEventListener) {
        if (supportsCaptureOption() || typeof options === "boolean") {
          element.removeEventListener(eventType, wrappedHandler, options);
        } else {
          element.removeEventListener(eventType, wrappedHandler, !!options.capture);
        }
      } else if (element.detachEvent) {
        element.detachEvent(`on${eventType}`, wrappedHandler);
      }

      delete listenerRegistry[key];
    }
  });
}

// ---------------------------------------------------------------------------
// unlistenByElement  [was: c8]
// Source line: 12049-12052
// ---------------------------------------------------------------------------

/**
 * Remove all event listeners registered on a specific element.
 *
 * @param {EventTarget} element [was: Q]
 */
export function unlistenByElement(element) { // was: c8
  for (const key in listenerRegistry) {
    if (listenerRegistry[key][0] === element) {
      unlisten(key);
    }
  }
}

// ---------------------------------------------------------------------------
// getEventTarget  [was: W8]
// Source lines: 12054-12062
// ---------------------------------------------------------------------------

/**
 * Extract the true target element from a DOM event, handling composed paths
 * and text-node targets.
 *
 * @param {Event} [event] [was: Q]
 * @returns {EventTarget}
 */
export function getEventTarget(event) { // was: W8
  event = event || window.event;
  let path; // was: c
  if (event.composedPath && typeof event.composedPath === "function") {
    path = event.composedPath();
  } else {
    path = event.path;
  }
  if (path && path.length) {
    return path[0];
  }
  event = event || window.event;
  let target = event.target || event.srcElement; // was: Q (reused)
  if (target.nodeType === 3) {
    target = target.parentNode; // text nodes -> parent element
  }
  return target;
}

// ---------------------------------------------------------------------------
// Exports (re-export registry for testing / advanced usage)
// ---------------------------------------------------------------------------

export {
  listenerRegistry, // was: Yn
  listenerCounter, // was: TDR
  supportsPassiveEvents, // was: Qt7
  supportsCaptureOption, // was: rsO
  findAncestor, // was: Ls
  findExistingListener, // was: K4y
  memoize, // was: a_
};
