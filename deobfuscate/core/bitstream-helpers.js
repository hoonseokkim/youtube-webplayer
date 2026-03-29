import { find } from './array-utils.js'; // was: g.Yx
import { OCR_TOKEN_REGEX } from '../data/session-storage.js'; // was: te3
import { URL_TEMPLATE_PARAM_REGEX } from '../data/session-storage.js'; // was: Nfy
import { NamedConfigItem } from '../data/session-storage.js'; // was: iNw
import { SLOT_ARRAY_STATE } from '../proto/messages-core.js'; // was: Xm
import { SIGNAL_INTERNAL } from '../data/session-storage.js'; // was: uZ
import { CONSTRUCTOR_GUARD } from '../proto/messages-core.js'; // was: hd
import { SIGNAL_TRACKING } from '../data/session-storage.js'; // was: zT
import { unwrapTrustedResourceUrl } from './composition-helpers.js'; // was: x3
import { clearPausableTimer } from './event-registration.js'; // was: y3
import { createVisualElement } from '../data/gel-params.js'; // was: x0
import { OptionalDep } from '../network/innertube-config.js'; // was: x1
import { reloadPage } from '../media/format-retry.js'; // was: bc
import { createTimeRanges } from '../media/codec-helpers.js'; // was: lo
import { parseQueryString } from './composition-helpers.js';
import { remove, slice } from './array-utils.js';
import { forEach } from './event-registration.js';
import { toString, endsWith, startsWith } from './string-utils.js';
import { getField } from '../proto/wire-format.js';
import { setStyle, createElement } from './dom-utils.js';
import { isArrayLike } from './type-helpers.js';
import { getUserAgent } from './browser-detection.js';
import { toArray } from './array-utils.js'; // was: g.Xi / g.cloneArray
import { Uri } from '../network/uri-utils.js'; // was: g.KG
import { globalScheduler } from './scheduler.js'; // was: g.YF
// TODO: resolve g.isEmptyString (was: g.n9, likely isEmptyOrWhitespace from string-utils.js)
// TODO: resolve g.sanitizeUrl (URL sanitization utility)
// TODO: resolve g.globalThis (global reference)

/**
 * bitstream-helpers.js -- QueryData map wrapper, URL matching, protobuf
 * field registry, reactive signals, network-status checks, bitmask
 * conversion, ARIA helpers, AnimationFrame / Throttle / Debounce timers,
 * CSS transition helpers, safe-style utilities, text directionality,
 * iterator adapters, cubic-bezier solver, and async event queue.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 8848-8899 (QueryData), 9135-9355 (URL matching, protobuf
 *   field map, reactive signals, network status, bitmask, ARIA, RAF timer,
 *   throttle, debounce), 9423-9639 (CSS animations, transitions, safe-style,
 *   text direction, iterator wrap, cubic bezier, range, UA sniff, async queue).
 *
 * Skipped ranges (covered elsewhere):
 *   8900-9135  -> media/bitstream-reader.js
 *   9356-9422  -> core/dom-utils.js
 */

// ---------------------------------------------------------------------------
// QueryData -- mutable multimap backed by a URL query-string
// Source lines 8849-8891
// ---------------------------------------------------------------------------

/**
 * A mutable multimap over URL query-string parameters.
 * [was: XJ]
 * @param {string|null} queryString [was: Q] - Raw query string.
 * @param {boolean}     caseInsensitive [was: c] - Lower-case keys on read.
 */
export class QueryData {
  constructor(queryString, caseInsensitive) {
    /** @type {Map|null} [was: W] */
    this.map = null;
    /** @type {number} [was: O] */
    this.count = 0;
    /** @type {string|null} [was: A] */
    this.queryString = queryString || null;
    /** @type {boolean} [was: j] */
    this.caseInsensitive = !!caseInsensitive;
  }
}

/**
 * Lazily initialise the internal Map from the raw query string.
 * [was: Bx]
 * @param {QueryData} queryData [was: Q]
 */
export function ensureQueryDataMap(queryData) { // was: Bx
  if (!queryData.map) {
    queryData.map = new Map();
    queryData.count = 0;
    if (queryData.queryString) {
      parseQueryString(queryData.queryString, (key, value) => { // was: yz
        queryData.add(decodeURIComponent(key), value); // was: Ni
      });
    }
  }
}

/**
 * Check whether a key exists in the QueryData.
 * [was: q1]
 * @param {QueryData} queryData [was: Q]
 * @param {string}    key       [was: c]
 * @returns {boolean}
 */
export function queryDataHas(queryData, key) { // was: q1
  ensureQueryDataMap(queryData);
  key = normalizeQueryKey(queryData, key);
  return queryData.map.has(key);
}

/**
 * Replace all values for a key with a new array of values.
 * [was: g.nG]
 * @param {QueryData} queryData [was: Q]
 * @param {string}    key       [was: c]
 * @param {string[]}  values    [was: W]
 */
export function queryDataSetAll(queryData, key, values) { // was: g.nG
  queryData.remove(key);
  if (values.length > 0) {
    queryData.queryString = null;
    queryData.map.set(normalizeQueryKey(queryData, key), toArray(values)); // was: g.Xi
    queryData.count = queryData.count + values.length;
  }
}

/**
 * Normalise a query-data key (optionally lower-casing).
 * [was: xF]
 * @param {QueryData} queryData [was: Q]
 * @param {string}    key       [was: c]
 * @returns {string}
 */
export function normalizeQueryKey(queryData, key) { // was: xF
  key = String(key);
  if (queryData.caseInsensitive) {
    key = key.toLowerCase();
  }
  return key;
}

/**
 * Convert a QueryData between case-sensitive and case-insensitive modes.
 * [was: Kly]
 * @param {QueryData} queryData      [was: Q]
 * @param {boolean}   caseInsensitive [was: c]
 */
export function setQueryDataCaseInsensitive(queryData, caseInsensitive) { // was: Kly
  if (caseInsensitive && !queryData.caseInsensitive) {
    ensureQueryDataMap(queryData);
    queryData.queryString = null;
    queryData.map.forEach(function (values, key) {
      const lower = key.toLowerCase();
      if (key !== lower) {
        this.remove(key);
        queryDataSetAll(this, lower, values);
      }
    }, queryData);
  }
  queryData.caseInsensitive = caseInsensitive;
}

/**
 * Serialise headers map to "key: value\r\n" string.
 * [was: g.DA]
 * @param {Object} headers [was: Q]
 * @returns {string}
 */
export function serializeHeaders(headers) { // was: g.DA
  let result = "";
  g.forEachEntry(headers, (value, name) => { // was: g.ZS
    result += name;
    result += ":";
    result += value;
    result += "\r\n";
  });
  return result;
}

// ---------------------------------------------------------------------------
// URL matching & protobuf field registry -- Source lines 9135-9234
// ---------------------------------------------------------------------------

/**
 * Return whether a ByteString-backed field resolves against a constant.
 * [was: $F]
 * @param {Object} fieldDescriptor [was: Q]
 * @returns {*}
 */
export function getFieldSentinel(fieldDescriptor) { // was: $F
  return fieldDescriptor.map.has(Dfm); // was: Dfm
}

/**
 * Determine whether a URL belongs to a known YouTube/Google tracking endpoint.
 * [was: HN3]
 * @param {string} url [was: Q]
 * @returns {boolean}
 */
export function isTrackingUrl(url) { // was: HN3
  if (g.isEmptyString(g.sanitizeUrl(url))) { // was: g.n9(g.yC(...))
    return false;
  }
  if (url.indexOf("://pagead2.googlesyndication.com/pagead/gen_204?id=yt3p&sr=1&") >= 0) {
    return true;
  }
  let parsed;
  try {
    parsed = new Uri(url); // was: g.KG
  } catch (_e) {
    return find(Px, (pattern) => url.search(pattern) > 0) != null; // was: g.Yx
  }
  return parsed.hostname.match(OCR_TOKEN_REGEX) // was: .D
    ? true
    : find(Px, (pattern) => url.match(pattern) != null) != null;
}

/**
 * Replace `{key}` tokens in a URL template using values from a data object.
 * [was: g.lZ]
 * @param {string} template [was: Q]
 * @param {Object} data     [was: c]
 * @returns {string}
 */
export function expandUrlTemplate(template, data) { // was: g.lZ
  return template.replace(URL_TEMPLATE_PARAM_REGEX, (match, key) => {
    try {
      let value = g.getDeepValue(data, key); // was: g.uD
      if (value == null || value.toString() == null) return match;
      value = value.toString();
      if (value === "" || !g.isEmptyString(g.sanitizeUrl(value))) {
        return encodeURIComponent(value).replace(/%2C/g, ",");
      }
    } catch (_e) { /* swallow */ }
    return match;
  });
}

/**
 * Get the field entries from a protobuf schema descriptor.
 * [was: y4x]
 * @param {Object} descriptor [was: Q]
 * @returns {Array}
 */
export function getProtobufFieldEntries(descriptor) { // was: y4x
  const fields = descriptor.fields; // was: .zU
  return createFieldMap(descriptor, fields, fields[SLOT_ARRAY_STATE] | 0, NamedConfigItem, 2, 1); // was: mK
}

/**
 * Ensure a frozen (serialised) protobuf wrapper is created or returned from cache.
 * [was: Flw]
 * @param {Object} proto [was: Q]
 * @returns {Object}
 */
export function getOrCreateFrozenWrapper(proto) { // was: Flw
  let cached;
  if ((cached = proto[SIGNAL_INTERNAL]) != null) {
    return cached;
  } else {
    if (CONSTRUCTOR_GUARD !== CONSTRUCTOR_GUARD) throw Error();
    return (proto[SIGNAL_INTERNAL] = createFrozenCopy(proto.map)); // was: ST0
  }
}

/**
 * Build a name-to-field lookup Map for a protobuf message type.
 * [was: ZNd]
 * @param {Object} proto [was: Q]
 * @returns {Map<string, *>}
 */
export function getFieldNameMap(proto) { // was: ZNd
  return proto[SIGNAL_TRACKING] ?? (proto[SIGNAL_TRACKING] = new Map(
    getProtobufFieldEntries(getOrCreateFrozenWrapper(proto)).map(
      (field) => [field.getName(), getField(field, 2)] // was: g.Ao
    )
  ));
}

// ---------------------------------------------------------------------------
// Reactive signals -- Source lines 9188-9234
// ---------------------------------------------------------------------------

/**
 * Propagate change notifications through a dependency graph.
 * [was: M1]
 * @param {Object} node [was: Q]
 */
export function notifyDependents(node) { // was: M1
  if (node.dependents !== undefined) { // was: .GZ
    const prevTracking = isTracking; // was: CG
    isTracking = true;
    try {
      for (let dep = node.dependents; dep !== undefined; dep = dep.next) { // was: .JQF
        const watcher = dep.watcher; // was: .WGJ
        if (!watcher.notified) { // was: .NH
          watcher.notified = true;
          notifyDependents(watcher);
          watcher.onNotify?.(watcher); // was: .uK
        }
      }
    } finally {
      isTracking = prevTracking;
    }
  }
}

/**
 * Create a reactive signal with get/set/update accessors.
 * [was: say]
 * @param {*}        initialValue [was: Q]
 * @param {Function} [equalsFn]   [was: c] - Equality check.
 * @returns {[Function, Function, Function]} [getter, setter, updater]
 */
export function createSignal(initialValue, equalsFn) { // was: say
  const signalNode = Object.create(signalPrototype); // was: Eyx
  signalNode.value = initialValue;
  if (equalsFn !== undefined) {
    signalNode.equals = equalsFn; // was: .M0
  }
  const getter = () => {
    if (isTracking) throw Error("");
    return signalNode.value;
  };
  getter[signalSymbol] = signalNode; // was: Jd
  return [
    getter,
    (newVal) => updateSignal(signalNode, newVal),
    (updaterFn) => {
      updateSignal(signalNode, updaterFn(signalNode.value));
    },
  ];
}

/**
 * Update a signal's value and propagate if changed.
 * [was: RO]
 * @param {Object} signalNode [was: Q]
 * @param {*}      newValue   [was: c]
 */
export function updateSignal(signalNode, newValue) { // was: RO
  if (!signalNode.equals(signalNode.value, newValue)) {
    signalNode.value = newValue;
    signalNode.version++;
    globalVersion++; // was: dfx
    notifyDependents(signalNode);
  }
}

/**
 * Create and register a named signal for debugging.
 * [was: kF]
 * @param {*}      initialValue [was: Q]
 * @param {string} [name=""]   [was: c]
 */
export function createNamedSignal(initialValue, name = "") { // was: kF
  const opts = {};
  const signal = createSignal(initialValue, opts.equals);
  const debugName = opts.debugName;
  signal[0][signalSymbol].debugName =
    debugName && name ? `${debugName}__${name}` : (debugName ?? name ?? "[signal]");
}

// ---------------------------------------------------------------------------
// Network-status probe -- Source lines 9236-9269
// ---------------------------------------------------------------------------

/**
 * Return or create the singleton network-status monitor.
 * [was: Llx]
 * @returns {NetworkStatusMonitor} [was: pG]
 */
export function getNetworkStatusMonitor() { // was: Llx
  const appConfig = globalScheduler; // was: g.YF
  if (!NetworkStatusMonitor.instance) {
    NetworkStatusMonitor.instance = new NetworkStatusMonitor(appConfig);
  }
  return NetworkStatusMonitor.instance;
}

/**
 * Probe connectivity by HEADing `/generate_204`.
 * [was: QN]
 * @param {NetworkStatusMonitor} monitor [was: Q]
 * @param {number}               [timeout] [was: c]
 * @returns {Promise<boolean>}
 */
export function probeNetworkStatus(monitor, timeout) { // was: QN
  if (monitor.pending) return monitor.pending; // was: .j
  return (monitor.pending = new Promise(async (resolve) => {
    const controller = window.AbortController
      ? new window.AbortController()
      : undefined;
    const signal = controller?.signal;
    let isOnline = false;
    try {
      if (controller) {
        monitor.timeoutId = monitor.timerService.setTimeout(() => { // was: .jF.FD
          controller.abort();
        }, timeout || 20_000);
      }
      await fetch("/generate_204", { method: "HEAD", signal });
      isOnline = true;
    } catch {
      isOnline = false;
    } finally {
      monitor.pending = undefined;
      if (monitor.timeoutId) {
        monitor.timerService.clearTimeout(monitor.timeoutId); // was: .jF.Q$
        monitor.timeoutId = 0;
      }
      if (isOnline !== monitor.online) { // was: .W
        monitor.online = isOnline;
        if (monitor.online) {
          monitor.dispatchEvent("networkstatus-online");
        } else {
          monitor.dispatchEvent("networkstatus-offline");
        }
      }
      resolve(isOnline);
    }
  }));
}

// ---------------------------------------------------------------------------
// Bitmask helpers -- Source lines 9271-9274
// ---------------------------------------------------------------------------

/**
 * Compute the numeric bitmask value from a boolean-array bitfield.
 * [was: wSd]
 * @param {Object} bitfield [was: Q] - Has `.data` (boolean[]) and `.W` (cached int).
 * @returns {number}
 */
export function bitmaskValue(bitfield) { // was: wSd
  if (bitfield.cachedValue === -1) { // was: .W
    bitfield.cachedValue = bitfield.data.reduce(
      (acc, bit, index) => acc + (bit ? 2 ** index : 0),
      0
    );
  }
  return bitfield.cachedValue;
}

// ---------------------------------------------------------------------------
// ARIA helpers -- Source lines 9276-9307
// ---------------------------------------------------------------------------

/**
 * Set role="link" on an element.
 * [was: c7]
 * @param {Element} element [was: Q]
 */
export function setRoleLink(element) { // was: c7
  element.setAttribute("role", "link");
}

/**
 * Set or clear the aria-label on an element.
 * [was: mr]
 * @param {Element}        element [was: Q]
 * @param {string|string[]} label  [was: c]
 */
export function setAriaLabel(element, label) { // was: mr
  if (Array.isArray(label)) {
    label = label.join(" ");
  }
  if (label === "" || label == undefined) {
    if (!ariaDefaults) { // was: W7
      ariaDefaults = {
        atomic: false,
        autocomplete: "none",
        dropeffect: "none",
        haspopup: false,
        live: "off",
        multiline: false,
        multiselectable: false,
        orientation: "vertical",
        readonly: false,
        relevant: "additions text",
        required: false,
        sort: "none",
        busy: false,
        disabled: false,
        hidden: false,
        invalid: "false",
      };
    }
    label = ariaDefaults;
    if ("label" in label) {
      element.setAttribute("aria-label", label.label);
    } else {
      element.removeAttribute("aria-label");
    }
  } else {
    element.setAttribute("aria-label", label);
  }
}

let ariaDefaults = null; // was: W7

/**
 * Read the aria-label from an element.
 * [was: K6]
 * @param {Element} element [was: Q]
 * @returns {string}
 */
export function getAriaLabel(element) { // was: K6
  const label = element.getAttribute("aria-label");
  return label == null || label == undefined ? "" : String(label);
}

// ---------------------------------------------------------------------------
// requestAnimationFrame polyfill timer -- Source lines 9309-9328
// ---------------------------------------------------------------------------

/**
 * Timer that delegates to requestAnimationFrame when available.
 * [was: g.T5]
 * @param {Function}     callback [was: Q]
 * @param {Window}       [win]    [was: c]
 * @param {*}            [context] [was: W]
 */
export class AnimationFrameTimer extends g.Disposable { // was: g.T5
  constructor(callback, win, context) {
    super();
    /** @type {number|null} [was: W] */
    this.rafId = null;
    /** @type {boolean} [was: j] */
    this.running = false;
    /** @type {Function} [was: D] */
    this.callback = callback;
    /** @type {*} [was: K] */
    this.context = context;
    /** @type {Window} [was: O] */
    this.window = win || window;
    /** @type {Function} [was: A] */
    this.boundTick = g.bind(this.tick, this); // was: g.EO
  }
}

/**
 * Get the native requestAnimationFrame from a window.
 * [was: o9]
 * @param {AnimationFrameTimer} timer [was: Q]
 * @returns {Function|null}
 */
export function getRequestAnimationFrame(timer) { // was: o9
  const win = timer.window;
  return (
    win.requestAnimationFrame ||
    win.webkitRequestAnimationFrame ||
    win.mozRequestAnimationFrame ||
    win.oRequestAnimationFrame ||
    win.msRequestAnimationFrame ||
    null
  );
}

/**
 * Get the native cancelAnimationFrame from a window.
 * [was: rq]
 * @param {AnimationFrameTimer} timer [was: Q]
 * @returns {Function|null}
 */
export function getCancelAnimationFrame(timer) { // was: rq
  const win = timer.window;
  return (
    win.cancelAnimationFrame ||
    win.cancelRequestAnimationFrame ||
    win.webkitCancelRequestAnimationFrame ||
    win.mozCancelRequestAnimationFrame ||
    win.oCancelRequestAnimationFrame ||
    win.msCancelRequestAnimationFrame ||
    null
  );
}

// ---------------------------------------------------------------------------
// Throttle / Debounce timer -- Source lines 9330-9355
// ---------------------------------------------------------------------------

/**
 * A timer that can be restarted and throttled.
 * [was: g.Uc]
 * @param {Function} callback [was: Q]
 * @param {number}   [interval=0] [was: c]
 * @param {*}        [context]    [was: W]
 */
export class ThrottleTimer extends g.Disposable { // was: g.Uc
  constructor(callback, interval, context) {
    super();
    /** @type {Function} [was: W] */
    this.callback = callback;
    /** @type {number} [was: eW] */
    this.interval = interval || 0;
    /** @type {*} [was: O] */
    this.context = context;
    /** @type {Function} [was: A] */
    this.boundFire = g.bind(this.fire, this); // was: g.EO
  }
}

/**
 * Immediately stop and fire the throttle timer.
 * [was: g.I9]
 * @param {ThrottleTimer} timer [was: Q]
 */
export function stopAndFire(timer) { // was: g.I9
  timer.stop();
  timer.fire(); // was: .SS
}

/**
 * Schedule the next invocation of a Debouncer's callback.
 * [was: Xr]
 * @param {Object} debouncer [was: Q]
 */
export function scheduleDebounce(debouncer) { // was: Xr
  debouncer.timerId = g.setTimeout(() => { // was: g.tz
    debouncer.timerId = null;
    if (debouncer.pending && !debouncer.running) { // was: .W, .O
      debouncer.pending = false;
      scheduleDebounce(debouncer);
    }
  }, debouncer.interval); // was: .eW
  const args = debouncer.queuedArgs; // was: .A
  debouncer.queuedArgs = null;
  debouncer.handler.apply(null, args); // was: .K
}

// ---------------------------------------------------------------------------
// CSS animation / transition helpers -- Source lines 9423-9512
// ---------------------------------------------------------------------------

/**
 * Base class for CSS-driven animations.
 * [was: g.H7]
 */
export class CssAnimation extends g.TransitionBase { // was: g.$R
  constructor() {
    super();
    /** @type {number} [was: W] */
    this.state = 0;
    /** @type {number|null} */
    this.endTime = null;
    /** @type {number|null} */
    this.startTime = null;
  }

  /** @returns {boolean} [was: isPlaying] */
  isPlaying() {
    return this.state === 1;
  }

  /** @returns {boolean} [was: isPaused] */
  isPaused() {
    return this.state === -1;
  }

  /** Fire "begin" event. [was: IC] */
  IC() {
    this.dispatchEvent("begin");
  }

  /** Fire "end" event. [was: KA] */
  getBufferedEnd() {
    this.dispatchEvent("end");
  }

  /** Fire "finish" event. [was: onFinish] */
  onFinish() {
    this.dispatchEvent("finish");
  }

  /** Fire "stop" event. [was: onStop] */
  onStop() {
    this.dispatchEvent("stop");
  }

  /**
   * Internal event dispatch helper.
   * [was: VO]
   */
  VO(eventName) {
    this.dispatchEvent(eventName);
  }
}

/**
 * Set CSS transition shorthand on an element.
 * [was: bNd]
 * @param {Element}       element     [was: Q]
 * @param {Array|string}  transitions [was: c]
 */
export function setCssTransition(element, transitions) { // was: bNd
  if (!Array.isArray(transitions)) {
    transitions = [transitions];
  }
  transitions = transitions.map((t) =>
    typeof t === "string"
      ? t
      : `${t.property} ${t.duration}s ${t.timing} ${t.delay}s`
  );
  g.setStyle(element, "transition", transitions.join(",")); // was: g.JA
}

/**
 * CSS transition animation with start/end style objects.
 * [was: NI]
 * @param {Element}  element     [was: Q]
 * @param {number}   duration    [was: c]
 * @param {Object}   startStyles [was: W]
 * @param {Object}   endStyles   [was: m]
 * @param {Array|Object} transitionDefs [was: K]
 */
export class CssTransitionAnimation extends CssAnimation { // was: NI
  constructor(element, duration, startStyles, endStyles, transitionDefs) {
    super();
    /** @type {Element} [was: O] */
    this.element = element;
    /** @type {number} [was: K] */
    this.duration = duration;
    /** @type {Object} [was: D] */
    this.startStyles = startStyles;
    /** @type {Object} [was: j] */
    this.endStyles = endStyles;
    /** @type {Array} [was: J] */
    this.transitions = Array.isArray(transitionDefs)
      ? transitionDefs
      : [transitionDefs];
  }
}

/**
 * Create an opacity fade transition.
 * [was: iB]
 * @param {Element} element      [was: Q]
 * @param {number}  duration     [was: c]
 * @param {number}  startOpacity [was: W]
 * @param {number}  endOpacity   [was: m]
 * @returns {CssTransitionAnimation}
 */
export function createFadeTransition(element, duration, startOpacity, endOpacity) { // was: iB
  return new CssTransitionAnimation(
    element,
    duration,
    { opacity: startOpacity },
    { opacity: endOpacity },
    { property: "opacity", duration, timing: "ease-in", delay: 0 }
  );
}

// ---------------------------------------------------------------------------
// Safe CSS style utilities -- Source lines 9460-9532
// ---------------------------------------------------------------------------

/**
 * Validate a CSS background-image value, stripping unsafe parts.
 * [was: gyR]
 * @param {string} value [was: Q]
 * @returns {string|null}
 */
export function sanitizeCssBackgroundImage(value) { // was: gyR
  value = value.trim();
  if (value === "") return null;

  const prefix = String(value.slice(0, 4)).toLowerCase();
  if (("url(" < prefix ? -1 : "url(" === prefix ? 0 : 1) === 0) {
    if (!value.endsWith(")") || (value ? value.split("(").length - 1 : 0) > 1 || (value && value.split(")"))) {
      // intentional fall-through; original source chains expressions
    }
    return null;
  }

  if (value.indexOf("(") > 0) {
    if (/"|'/.test(value)) return null;
    const funcRegex = /([\-\w]+)\(/g;
    let funcMatch;
    while ((funcMatch = funcRegex.exec(value))) {
      if (!(funcMatch[1].toLowerCase() in allowedCssFunctions)) { // was: jaR
        return null;
      }
    }
  }
  return value;
}

/**
 * Get a property getter from a prototype, if available.
 * [was: yN]
 * @param {string} className [was: Q]
 * @param {string} propName  [was: c]
 * @returns {Function|null}
 */
export function getPropertyGetter(className, propName) { // was: yN
  const ctor = g.globalThis[className]; // was: g.qX
  if (!ctor || !ctor.prototype) return null;
  const desc = Object.getOwnPropertyDescriptor(ctor.prototype, propName);
  return (desc && desc.get) || null;
}

/**
 * Get a method from CSSStyleDeclaration prototype.
 * [was: SC]
 * @param {string} methodName [was: Q]
 * @returns {Function|null}
 */
export function getCssStyleMethod(methodName) { // was: SC
  const CSSDecl = g.globalThis.CSSStyleDeclaration;
  return CSSDecl && CSSDecl.prototype && CSSDecl.prototype[methodName] || null;
}

/**
 * Safely call a property/method on an element, with clobbering detection.
 * [was: Ze]
 * @param {Function|null} safeFn     [was: Q]
 * @param {Element}       element    [was: c]
 * @param {string}        methodName [was: W]
 * @param {Array}         args       [was: m]
 * @returns {*}
 */
export function safeCallElementMethod(safeFn, element, methodName, args) { // was: Ze
  if (safeFn) return safeFn.apply(element, args);
  if (g.isIE && document.documentMode < 10) { // was: g.Fr
    if (!element[methodName].call) throw Error("IE Clobbering detected");
  } else if (typeof element[methodName] !== "function") {
    throw Error("Clobbering detected");
  }
  return element[methodName].apply(element, args);
}

/**
 * Sanitise an element's inline styles, stripping unsafe values.
 * [was: GkX]
 * @param {CSSStyleDeclaration} sourceStyle [was: Q]
 * @returns {string}
 */
export function sanitizeInlineStyle(sourceStyle) { // was: GkX
  if (!sourceStyle) return "";
  const tempStyle = document.createElement("div").style;
  getStylePropertyNames(sourceStyle).forEach((prop) => {
    const normalized = g.isWebKit && prop in vendorPrefixOverrides // was: g.xG, fOx
      ? prop
      : prop.replace(
          /^-(?:apple|css|epub|khtml|moz|mso?|o|rim|wap|webkit|xv)-(?=[a-z])/i,
          ""
        );
    if (!startsWith(normalized, "--") && !startsWith(normalized, "var")) { // was: x9
      let rawValue =
        safeCallElementMethod(
          propertyValueGetter, // was: vy_
          sourceStyle,
          sourceStyle.getPropertyValue ? "getPropertyValue" : "getAttribute",
          [prop]
        ) || "";
      rawValue = sanitizeCssBackgroundImage(rawValue);
      if (rawValue != null) {
        safeCallElementMethod(
          propertyValueSetter, // was: aOR
          tempStyle,
          tempStyle.setProperty ? "setProperty" : "setAttribute",
          [normalized, rawValue]
        );
      }
    }
  });
  return tempStyle.cssText || "";
}

/**
 * Extract property names from a CSSStyleDeclaration.
 * [was: ONd]
 * @param {CSSStyleDeclaration} style [was: Q]
 * @returns {string[]}
 */
export function getStylePropertyNames(style) { // was: ONd
  if (g.isArrayLike(style)) { // was: g.iw
    return toArray(style); // was: g.Xi
  }
  const keys = g.getObjectKeys(style); // was: g.Ov
  g.removeElement(keys, "cssText"); // was: g.o0
  return keys;
}

// ---------------------------------------------------------------------------
// Text directionality -- Source lines 9520-9532
// ---------------------------------------------------------------------------

/**
 * Estimate text direction ("ltr" or "rtl") by character frequency heuristic.
 * [was: g.sc]
 * @param {string} text [was: Q]
 * @returns {"ltr"|"rtl"}
 */
export function estimateTextDirection(text) { // was: g.sc
  let rtlCount = 0;
  let total = 0;
  let hasWeakDir = false;
  const tokens = text.split(dirSplitRegex); // was: $fy
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (g.rtlCharRegex.test(token)) { // was: g.Ec
      rtlCount++;
      total++;
    } else if (weakDirRegex.test(token)) { // was: Pjd
      hasWeakDir = true;
    } else if (ltrCharRegex.test(token)) { // was: lO_
      total++;
    } else if (numericDirRegex.test(token)) { // was: uIK
      hasWeakDir = true;
    }
  }
  const dirScore = total === 0 ? (hasWeakDir ? 1 : 0) : rtlCount / total > 0.4 ? -1 : 1;
  return (dirScore === 0 ? null : dirScore) === -1 ? "rtl" : "ltr";
}

// ---------------------------------------------------------------------------
// Iterator adapter -- Source lines 9534-9544
// ---------------------------------------------------------------------------

/**
 * Wrap any iterable / iterator / legacy F7 into a standard lazy Iterator.
 * [was: g.bB]
 * @param {Iterable|Iterator|Object} source [was: Q]
 * @returns {LazyIterator} [was: dq|L6|wq]
 */
export function asIterator(source) { // was: g.bB
  if (
    source instanceof LazyIterator ||
    source instanceof MappedIterator ||
    source instanceof FilteredIterator
  ) {
    return source;
  }
  if (typeof source.next === "function") {
    return new LazyIterator(() => source);
  }
  if (typeof source[Symbol.iterator] === "function") {
    return new LazyIterator(() => source[Symbol.iterator]());
  }
  if (typeof source.getIterator === "function") { // was: .F7
    return new LazyIterator(() => source.getIterator());
  }
  throw Error("Not an iterator or iterable.");
}

// ---------------------------------------------------------------------------
// Cubic Bezier curve -- Source lines 9546-9614
// ---------------------------------------------------------------------------

/**
 * A cubic Bezier curve defined by eight control-point coordinates.
 * [was: jC]
 */
export class CubicBezier {
  /**
   * @param {number} x0 [was: Q]
   * @param {number} y0 [was: c]
   * @param {number} x1 [was: W]
   * @param {number} y1 [was: m]
   * @param {number} x2 [was: K]
   * @param {number} y2 [was: T]
   * @param {number} x3 [was: r]
   * @param {number} y3 [was: U]
   */
  constructor(createVisualElement, y0, OptionalDep, y1, x2, y2, unwrapTrustedResourceUrl, clearPausableTimer) {
    this.createVisualElement = createVisualElement;  // was: .W
    this.y0 = y0;  // was: .J
    this.cx1 = OptionalDep; // was: .A
    this.cy1 = y1; // was: .K
    this.cx2 = x2; // was: .j
    this.cy2 = y2; // was: .D
    this.unwrapTrustedResourceUrl = unwrapTrustedResourceUrl;  // was: .O
    this.clearPausableTimer = clearPausableTimer;  // was: .L
  }
}

/**
 * Evaluate the X coordinate of a cubic Bezier at parameter t.
 * [was: gq]
 * @param {CubicBezier} curve [was: Q]
 * @param {number}       t     [was: c]
 * @returns {number}
 */
export function bezierX(curve, t) { // was: gq
  if (t === 0) return curve.createVisualElement;
  if (t === 1) return curve.unwrapTrustedResourceUrl;
  let ab = lerp(curve.createVisualElement, curve.cx1, t);
  let reloadPage = lerp(curve.cx1, curve.cx2, t);
  const cd = lerp(curve.cx2, curve.unwrapTrustedResourceUrl, t);
  ab = lerp(ab, reloadPage, t);
  reloadPage = lerp(reloadPage, cd, t);
  return lerp(ab, reloadPage, t);
}

/**
 * Evaluate the Y coordinate of a cubic Bezier at parameter t.
 * [was: Oc]
 * @param {CubicBezier} curve [was: Q]
 * @param {number}       t     [was: c]
 * @returns {number}
 */
export function bezierY(curve, t) { // was: Oc
  if (t === 0) return curve.y0;
  if (t === 1) return curve.clearPausableTimer;
  let ab = lerp(curve.y0, curve.cy1, t);
  let reloadPage = lerp(curve.cy1, curve.cy2, t);
  const cd = lerp(curve.cy2, curve.clearPausableTimer, t);
  ab = lerp(ab, reloadPage, t);
  reloadPage = lerp(reloadPage, cd, t);
  return lerp(ab, reloadPage, t);
}

/**
 * Solve for the Bezier parameter t at a given X value using
 * Newton-Raphson then bisection fallback.
 * [was: f6]
 * @param {CubicBezier} curve  [was: Q]
 * @param {number}       xTarget [was: c]
 * @returns {number} parameter t in [0, 1]
 */
export function solveBezierT(curve, xTarget) { // was: f6
  let t = (xTarget - curve.createVisualElement) / (curve.unwrapTrustedResourceUrl - curve.createVisualElement);
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let createTimeRanges = 0;
  let hi = 1;
  let xAtT = 0;

  // Newton-Raphson phase
  for (let i = 0; i < 8; i++) {
    xAtT = bezierX(curve, t);
    const slope = (bezierX(curve, t + 1e-6) - xAtT) / 1e-6;
    if (Math.abs(xAtT - xTarget) < 1e-6) return t;
    if (Math.abs(slope) < 1e-6) break;
    if (xAtT < xTarget) createTimeRanges = t;
    else hi = t;
    t -= (xAtT - xTarget) / slope;
  }

  // Bisection fallback
  for (let i = 0; Math.abs(xAtT - xTarget) > 1e-6 && i < 8; i++) {
    if (xAtT < xTarget) {
      createTimeRanges = t;
      t = (t + hi) / 2;
    } else {
      hi = t;
      t = (t + createTimeRanges) / 2;
    }
    xAtT = bezierX(curve, t);
  }
  return t;
}

/**
 * A numeric range [start, end], auto-sorted so start <= end.
 * [was: v7]
 * @param {number} a [was: Q]
 * @param {number} b [was: c]
 */
export class NumericRange {
  constructor(a, b) {
    this.start = a < b ? a : b;
    this.end = a < b ? b : a;
  }
}

// ---------------------------------------------------------------------------
// User-agent helpers -- Source lines 9616-9622
// ---------------------------------------------------------------------------

/**
 * Extract a capture group from a user-agent regex match.
 * [was: a9]
 * @param {RegExp} regex [was: Q]
 * @returns {string}
 */
export function extractUAMatch(regex) { // was: a9
  const match = regex.exec(g.getUserAgent()); // was: g.iC
  return match ? match[1] : "";
}

/**
 * Check if the current browser version is in a known set.
 * [was: G5]
 * @param {string} version [was: Q]
 * @returns {boolean}
 */
export function isKnownBrowserVersion(version) { // was: G5
  return g.indexOf(knownVersionsList, version) >= 0; // was: g.N$, hL3
}

// ---------------------------------------------------------------------------
// Async event queue -- Source lines 9624-9639
// ---------------------------------------------------------------------------

/**
 * An asynchronous event/task queue that dispatches in order.
 * [was: g.$K]
 * @param {boolean} [useAsync] [was: Q]
 */
export class AsyncQueue extends g.Disposable { // was: g.$K
  constructor(useAsync) {
    super();
    /** @type {number} [was: D] */
    this.dispatchDepth = 1;
    /** @type {Array} [was: A] */
    this.queue = [];
    /** @type {number} [was: j] */
    this.queueIndex = 0;
    /** @type {Array} [was: W] */
    this.listeners = [];
    /** @type {Object} [was: O] */
    this.listenerMap = {};
    /** @type {boolean} [was: J] */
    this.useAsync = !!useAsync;
  }
}

/**
 * Schedule an async callback invocation.
 * [was: zL3]
 * @param {Function} fn      [was: Q]
 * @param {*}        context  [was: c]
 * @param {Array}    args     [was: W]
 */
export function scheduleAsyncCallback(fn, context, args) { // was: zL3
  g.nextTick(() => { // was: g.mN
    fn.apply(context, args);
  });
}
