/**
 * Event Registration, Closure Promise, Deferred, Async Utilities, and Network Helpers
 *
 * Deobfuscated from: player_es6.vflset/en_US/base.js
 *
 * Source lines covered (non-overlapping with other files):
 *   7365–7608  Timer constructor tail, setTimeout helper, metric registration,
 *              HTTP-to-gRPC status maps, JSON serializer, XHR error descriptions,
 *              XmlHttpFactory base classes
 *   7774–8693  Performance timing, log dispatcher, throttled callback, logger factory,
 *              script-loader singleton, script injection helpers, protobuf RPC helpers,
 *              challenge/attestation lifecycle (F1O, Zs0, EGW, vG, $d, etc.),
 *              session-storage crypto, Jenkins hash, pausable timer, gRPC stream
 *              wiring, unary RPC helper, collection iteration utilities
 *   8726–8776  Collection value/key extraction and forEach
 *
 * Lines 7609–7773 (XhrIo / g.aY) covered by network files — SKIPPED.
 * Lines 8694–8725 (FetchXhr / pZ, Qt, mv, cx) covered by network files — SKIPPED.
 */
import { AutoMetricLogger } from '../data/logger-init.js'; // was: AAm
import { getBooleanAttr } from '../modules/caption/caption-internals.js'; // was: jO
import { getAriaLabel } from './bitstream-helpers.js'; // was: K6
import { getProximaPreference } from '../ads/ad-async.js'; // was: AR
import { readEmsgByte } from '../media/format-setup.js'; // was: hR
import { getConnection } from '../modules/remote/mdx-client.js'; // was: o3
import { fetchAttestationChallenge } from '../network/uri-utils.js'; // was: SK
import { logAdEventWithSlotLayout } from '../ads/ad-telemetry.js'; // was: cR
import { createTimeRanges } from '../media/codec-helpers.js'; // was: lo
import { FormatInfo } from '../media/codec-tables.js'; // was: OU
import { createFadeTransition } from './bitstream-helpers.js'; // was: iB
import { polyfillRegistry } from './polyfills.js'; // was: Qn
import { isPS3 } from './composition-helpers.js'; // was: S$
import { SlotIdFulfilledEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: Zg
import { clear, slice, splice } from './array-utils.js';
import { serialize } from '../proto/protobuf-writer.js';
import { toString } from './string-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { NoOpLogger } from '../data/logger-init.js';
import { createElement, removeNode, getElementsByTagName, appendChild } from './dom-utils.js';
import { setProtoField, ExponentialBackoff } from './event-system.js';
import { getSubMessage } from '../proto/wire-format.js';
import { handleError } from '../player/context-updates.js';
import { RpcError } from '../data/event-logging.js';
import { getStatus, listenOnce } from './composition-helpers.js';
import { isArrayLike } from './type-helpers.js';
import { objectValues, objectKeys } from './object-utils.js';

// ============================================================================
// Timer constructor tail (g.DE) — lines 7365-7371
// The constructor body is partially in timer.js; these are the remaining
// property initialisers that belong to the same function.
// (Included here for completeness; the class shell lives in core/timer.js.)
// ============================================================================

// --- already covered by core/timer.js ---

// ============================================================================
// setTimeout helper — line 7373
// ============================================================================

/**
 * Schedule a function (or handleEvent object) to run after `delay` ms.
 * Returns the browser timer id, or -1 if the delay exceeds 2^31-1.
 *
 * [was: g.tz]
 *
 * @param {Function|{handleEvent: Function}} listener
 * @param {number} delay - Milliseconds (clamped to 0).
 * @param {*}      [context] - `this` binding for plain-function listeners.
 * @returns {number} Timer id, or -1 on overflow.
 */
export function scheduleMacroTask(listener, delay, context) { // was: g.tz
  if (typeof listener === "function") {
    if (context) {
      listener = listener.bind(context); // was: (0, g.EO)(listener, context)
    }
  } else if (listener && typeof listener.handleEvent === "function") {
    listener = listener.handleEvent.bind(listener); // was: (0, g.EO)(listener.handleEvent, listener)
  } else {
    throw Error("Invalid listener argument");
  }
  return Number(delay) > 2147483647
    ? -1
    : globalThis.setTimeout(listener, delay || 0); // was: g.qX.setTimeout(...)
}

// ============================================================================
// HJ — Promise-wrapped setTimeout — lines 7385-7397
// ============================================================================

/**
 * Return a ClosurePromise that resolves to `value` after `delay` ms.
 * If scheduling fails (timer id === -1) the promise rejects.
 * Cancellation clears the underlying timer.
 *
 * [was: HJ]
 *
 * @param {number} delay  - Milliseconds to wait.
 * @param {*}      value  - Resolution value.
 * @returns {ClosurePromise}
 */
export function delayedResolve(delay, value) { // was: HJ
  let timerId = null; // was: W
  return (new ClosurePromise(function (resolve, reject) { // was: g.RF
    timerId = scheduleMacroTask(function () {
      resolve(value);
    }, delay);
    if (timerId === -1) {
      reject(Error("Failed to schedule timer."));
    }
  })).catch_(function (err) { // was: .fF(...)
    globalThis.clearTimeout(timerId); // was: g.qX.clearTimeout(W)
    throw err;
  });
}

// ============================================================================
// Metric registration helpers — lines 7399-7435
// ============================================================================

/**
 * Register a *histogram* metric on a metric host.
 * No-op if the key already exists.
 *
 * [was: iS]
 *
 * @param {object} host        - Object with `.O` Map of metrics.
 * @param {string} key         - Metric key.
 * @param {...*}   fieldSpecs  - Field descriptors forwarded to HistogramMetric.
 */
export function registerHistogram(host, key, ...fieldSpecs) { // was: iS
  if (!host.O.has(key)) {
    host.O.set(key, new HistogramMetric(key, fieldSpecs)); // was: new NA(key, fieldSpecs)
  }
}

/**
 * Register a *counter* metric on a metric host.
 * No-op if the key already exists.
 *
 * [was: g.SH]
 *
 * @param {object} host
 * @param {string} key
 * @param {...*}   fieldSpecs
 */
export function registerCounter(host, key, ...fieldSpecs) { // was: g.SH
  if (!host.O.has(key)) {
    host.O.set(key, new CounterMetric(key, fieldSpecs)); // was: new yU(key, fieldSpecs)
  }
}

/**
 * Increment a counter metric by 1.
 *
 * [was: g.ZE]
 *
 * @param {object} host
 * @param {string} key
 * @param {...*}   fieldValues
 */
export function incrementCounter(host, key, ...fieldValues) { // was: g.ZE
  incrementCounterBy(host, key, 1, fieldValues); // was: g.Fn(Q, c, 1, W)
}

/**
 * Check threshold and trigger a flush when the accumulated count
 * reaches the configured limit.
 *
 * [was: E_]
 *
 * @param {object} host - Object with `.W` (timer), `.K` (count), `.A` (threshold), `.j` (flush fn).
 */
function checkFlushThreshold(host) { // was: E_
  if (!host.W.enabled) {
    host.W.start();
  }
  host.K++;
  if (host.K >= host.A) {
    host.j();
  }
}

/**
 * Clear all metric stores in the given array.
 *
 * [was: cAd]
 *
 * @param {Array} metrics
 */
export function clearAllMetrics(metrics) { // was: cAd
  for (let i = 0; i < metrics.length; i++) {
    metrics[i].clear();
  }
}

/**
 * Get a metric from the host unless it has been suppressed.
 *
 * [was: s_]
 *
 * @param {object} host - Object with `.J` (suppression set) and `.O` (metric map).
 * @param {string} key
 * @returns {object|undefined}
 */
function getMetricIfNotSuppressed(host, key) { // was: s_
  return host.J.has(key) ? undefined : host.O.get(key); // was: Q.J.has(c) ? void 0 : Q.O.get(c)
}

/**
 * Increment a counter metric by an arbitrary amount.
 *
 * [was: g.Fn]
 *
 * @param {object} host
 * @param {string} key
 * @param {number} amount
 * @param {...*}   fieldValues
 */
export function incrementCounterBy(host, key, amount, ...fieldValues) { // was: g.Fn
  const metric = getMetricIfNotSuppressed(host, key); // was: c = s_(Q, c)
  if (metric && metric instanceof CounterMetric) { // was: c instanceof yU
    const wrappedValues = [fieldValues]; // was: m = [m]
    let prevCount = 0; // was: T = 0
    const existing = lookupMetricEntry(metric, [wrappedValues]); // was: Ps(c, [m])
    const entry = existing && existing.length ? existing[0] : undefined;
    if (entry) {
      prevCount = entry.W; // was: T = K.W
    }
    metric.W.set(
      compositeKey([wrappedValues]), // was: D4([m])
      [new MetricValue(prevCount + amount)] // was: [new dV(T + W)]
    );
    checkFlushThreshold(host); // was: E_(Q)
  }
}

// ============================================================================
// HTTP status → gRPC status mapping — lines 7437-7468
// ============================================================================

/**
 * Map an HTTP status code to a gRPC-style numeric status code.
 *
 * [was: LO]
 *
 * @param {number} httpStatus
 * @returns {number} gRPC status code (0 = OK, 2 = UNKNOWN, etc.)
 */
export function httpStatusToGrpcCode(httpStatus) { // was: LO
  switch (httpStatus) {
    case 200: return 0;
    case 400: return 3;
    case 401: return 16;
    case 403: return 7;
    case 404: return 5;
    case 409: return 10;
    case 412: return 9;
    case 429: return 8;
    case 499: return 1;
    case 500: return 2;
    case 501: return 12;
    case 503: return 14;
    case 504: return 4;
    default:  return 2;
  }
}

// ============================================================================
// gRPC status code → name — lines 7470-7509
// ============================================================================

/**
 * Map a gRPC numeric status code to its canonical string name.
 *
 * [was: W1y]
 *
 * @param {number} code
 * @returns {string}
 */
export function grpcCodeToName(code) { // was: W1y
  switch (code) {
    case 0:  return "OK";
    case 1:  return "CANCELLED";
    case 2:  return "UNKNOWN";
    case 3:  return "INVALID_ARGUMENT";
    case 4:  return "DEADLINE_EXCEEDED";
    case 5:  return "NOT_FOUND";
    case 6:  return "ALREADY_EXISTS";
    case 7:  return "PERMISSION_DENIED";
    case 16: return "UNAUTHENTICATED";
    case 8:  return "RESOURCE_EXHAUSTED";
    case 9:  return "FAILED_PRECONDITION";
    case 10: return "ABORTED";
    case 11: return "OUT_OF_RANGE";
    case 12: return "UNIMPLEMENTED";
    case 13: return "INTERNAL";
    case 14: return "UNAVAILABLE";
    case 15: return "DATA_LOSS";
    default: return "";
  }
}

// ============================================================================
// JSON serializer — lines 7511-7576
// ============================================================================

/**
 * Serialize a value to a JSON string (custom Closure implementation).
 *
 * [was: g.bS]
 *
 * @param {*} value
 * @returns {string}
 */
export function jsonSerialize(value) { // was: g.bS
  return (new JsonSerializer()).serialize(value); // was: (new wV).Eg(Q)
}

/**
 * Closure-library JSON serializer.
 *
 * [was: wV]
 */
class JsonSerializer { // was: wV
  /**
   * Serialize a value to JSON.
   * [was: wV.prototype.Eg]  (prototype set at line ~62097)
   *
   * @param {*} value
   * @returns {string}
   */
  serialize(value) { // was: Eg
    const parts = [];
    serializeValue(this, value, parts); // was: jH(this, Q, c)
    return parts.join("");
  }
}

/**
 * Recursively serialize a value into an array of string fragments.
 *
 * [was: jH]
 *
 * @param {JsonSerializer} serializer
 * @param {*} value
 * @param {string[]} output
 */
function serializeValue(serializer, value, output) { // was: jH
  if (value == null) {
    output.push("null");
  } else {
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        const arr = value; // was: m
        const len = arr.length; // reuse c
        output.push("[");
        let separator = "";
        for (let i = 0; i < len; i++) {
          output.push(separator);
          serializeValue(serializer, arr[i], output);
          separator = ",";
        }
        output.push("]");
        return;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean) {
        value = value.valueOf();
      } else {
        output.push("{");
        let separator = "";
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const propVal = value[key]; // was: T
            if (typeof propVal !== "function") {
              output.push(separator);
              serializeString(key, output); // was: gV(m, W)
              output.push(":");
              serializeValue(serializer, propVal, output);
              separator = ",";
            }
          }
        }
        output.push("}");
        return;
      }
    }
    switch (typeof value) {
      case "string":
        serializeString(value, output);
        break;
      case "number":
        output.push(isFinite(value) && !isNaN(value) ? String(value) : "null");
        break;
      case "boolean":
        output.push(String(value));
        break;
      case "function":
        output.push("null");
        break;
      default:
        throw Error("Unknown type: " + typeof value);
    }
  }
}

/**
 * JSON-encode a string, escaping control characters and non-ASCII.
 *
 * [was: gV]
 *
 * @param {string} str
 * @param {string[]} output
 */
function serializeString(str, output) { // was: gV
  output.push('"', str.replace(JSON_ESCAPE_RE, function (ch) { // was: mnK
    let escaped = JSON_ESCAPE_MAP[ch]; // was: O_[W]
    if (!escaped) {
      escaped = "\\u" + (ch.charCodeAt(0) | 65536).toString(16).slice(1);
      JSON_ESCAPE_MAP[ch] = escaped;
    }
    return escaped;
  }), '"');
}

/**
 * Map of characters to their JSON escape sequences.
 * [was: O_]  (defined at line ~62103)
 */
const JSON_ESCAPE_MAP = { // was: O_
  '"': '\\"',
  "\\": "\\\\",
  "/": "\\/",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\v": "\\u000b",
};

/**
 * RegExp matching characters that need JSON-escaping.
 * [was: mnK]  (defined at line ~62114)
 */
const JSON_ESCAPE_RE = // was: mnK
  /\uffff/.test("\uffff")
    ? /[\\"\x00-\x1f\x7f-\uffff]/g
    : /[\\"\x00-\x1f\x7f-\xff]/g;

// ============================================================================
// XHR error code → description — lines 7578-7603
// ============================================================================

/**
 * Return a human-readable description for an XHR error code.
 *
 * [was: K1d]
 *
 * @param {number} errorCode
 * @returns {string}
 */
export function xhrErrorDescription(NetworkErrorCode) { // was: K1d
  switch (NetworkErrorCode) {
    case 0: return "No Error";
    case 1: return "Access denied to content document";
    case 2: return "File not found";
    case 3: return "Firefox silently errored";
    case 4: return "Application custom error";
    case 5: return "An exception occurred";
    case 6: return "Http response at 400 or 500 level";
    case 7: return "Request was aborted";
    case 8: return "Request timed out";
    case 9: return "The resource is not available offline";
    default: return "Unrecognized error code";
  }
}

// ============================================================================
// XmlHttpFactory base classes — lines 7605-7608
// ============================================================================

/**
 * Abstract base class for creating XMLHttpRequest objects.
 *
 * [was: fO]
 */
export class XmlHttpFactory { // was: fO
  // Empty base — subclasses override .W() to produce XMLHttpRequest instances.
}

/**
 * Default XmlHttpFactory implementation that creates native XMLHttpRequest.
 * Inherits from XmlHttpFactory.  (Prototype method set at line ~62117.)
 *
 * [was: vJ]
 */
export class DefaultXmlHttpFactory extends XmlHttpFactory { // was: vJ
  /**
   * Create a new XMLHttpRequest.
   * [was: vJ.prototype.W]  (line ~62117)
   *
   * @returns {XMLHttpRequest}
   */
  createInstance() { // was: W
    return new XMLHttpRequest();
  }
}

// ======================= LINES 7609-7773: XhrIo (SKIPPED) ===================

// ============================================================================
// Performance timing wrapper — lines 7775-7780
// ============================================================================

/**
 * Invoke `fn`, measure its wall-clock time, report it via
 * `logger.A(label, elapsed)`, and return the function's result.
 *
 * [was: pO]
 *
 * @param {object}   logger   - Object with `.A(label, elapsed)` method.
 * @param {Function} fn       - Zero-arg function to time.
 * @param {string}   label    - Metric label.
 * @returns {*} The return value of `fn`.
 */
export function timedInvoke(logger, fn, label) { // was: pO
  const start = performanceNow(); // was: Yu()
  const result = fn(); // was: c = c()
  logger.A(label, performanceNow() - start); // was: Q.A(W, Yu() - m)
  return result;
}

// ============================================================================
// Log dispatcher builder — lines 7782-7811
// ============================================================================

/**
 * Build and configure a log-flushing dispatcher (cG instance) that wraps
 * a serialised protobuf request builder.
 *
 * [was: IJd]
 *
 * @param {*}        url        - Request URL (wrapped through protobuf builder).
 * @param {Array}    extraData  - Additional data entries.
 * @param {Function} errorCb    - Error callback.
 * @param {*}        [ttl]      - Optional time-to-live.
 * @returns {object} A configured dispatcher (cG instance).
 */
export function buildLogDispatcher(url, extraData, errorCb, ttl) { // was: IJd
  let builder = setLogRequestUrl(setLogEnabled(createLogRequest(new LogRequestProto(), url))).fN(); // was: hAX(lQK($iw(new Q3, Q))).fN()
  if (extraData.length) {
    addLogEntries(builder, createLogArray(new LogArrayProto(), extraData)); // was: utx(Q, ZRw(new rA7, c))
  }
  if (ttl !== undefined) {
    builder.Yo = ttl; // was: Q.Yo = m
  }
  const serializer = new LogSerializer(builder.build()); // was: new UnK(Q.build())
  attachDisposable(serializer, builder); // was: g.F(K, Q)
  const dispatcher = new LogDispatcher({ // was: new cG(...)
    flush(controller) { // was: flush(r)
      try {
        serializer.flush(controller); // was: K.flush(r)
      } catch (err) {
        errorCb(err); // was: W(U)
      }
    },
  });
  dispatcher.addOnDisposeCallback(() => {
    setTimeout(() => {
      try {
        dispatcher.j(); // was: T.j()
      } finally {
        serializer.dispose(); // was: K.dispose()
      }
    });
  });
  dispatcher.A = 1e5; // was: T.A = 1E5
  dispatcher.flushInterval = 3e4; // was: T.flushInterval = 3E4
  dispatcher.W.setInterval(3e4); // was: T.W.setInterval(3E4)
  return dispatcher;
}

// ============================================================================
// Throttled callback — lines 7814-7827
// ============================================================================

/**
 * Schedule a throttled callback: the callback is invoked no sooner than
 * `interval` ms after the previous invocation.
 *
 * [was: XBO]
 *
 * @param {object} entry - Object with `.W` (lastTime), `.O` (interval),
 *                         `.timer`, `.callback`.
 */
export function scheduleThrottledCallback(entry) { // was: XBO
  if (entry.timer === undefined) {
    const remaining = Math.max(0, entry.W + entry.O - performanceNow()); // was: Yu()
    entry.timer = setTimeout(() => {
      try {
        entry.callback();
      } finally {
        entry.W = performanceNow(); // was: Yu()
        entry.timer = undefined;
      }
    }, remaining);
  }
}

// ============================================================================
// Logger factory helper — lines 7829-7831
// ============================================================================

/**
 * Create a new instrumented logger (AAm) with the given config and filters.
 *
 * [was: eR3]
 *
 * @param {object} config   - Logger configuration.
 * @param {Array}  [filters=[]] - Optional filter array.
 * @returns {object} AAm instance.
 */
export function createLogger(config, filters = []) { // was: eR3
  return new AutoMetricLogger(config, filters); // external class, not inlined
}

// ============================================================================
// performanceNow — line 7833
// ============================================================================

/**
 * High-resolution timestamp (ms) via `performance.now()`, falling back to
 * `Date.now()`.
 *
 * [was: Yu]
 *
 * @returns {number}
 */
export function performanceNow() { // was: Yu
  return globalThis.performance?.now?.() ?? Date.now();
}

// ============================================================================
// Logger config adapter — lines 7837-7849
// ============================================================================

/**
 * Build a logger from a structured options object,
 * returning a no-op logger (WG) if the `disable` flag is set.
 *
 * [was: mu]
 *
 * @param {object} options - Options with fields `.MP`, `.Pg`, `.IS`, `.Yo`, `.Oy`, `.wY`, `.disable`.
 * @param {*}      [filters] - Optional filter source (converted via `fd`).
 * @returns {object}
 */
export function createLoggerFromOptions(options, filters) { // was: mu
  if (options.disable) {
    return new NoOpLogger(); // was: new WG
  }
  const converted = filters ? convertFilters(filters) : []; // was: fd(c)
  return createLogger(
    {
      MP: options.MP, // was: Q.MP
      Av: options.Pg, // was: Q.Pg
      getBooleanAttr: options.IS, // was: Q.IS
      Yo: options.Yo,
      Oy: options.Oy,
      wY: options.wY,
    },
    converted
  );
}

// ============================================================================
// TrustedResourceUrl extraction — lines 7851-7856
// ============================================================================

/**
 * Extract a TrustedResourceUrl from a protobuf message field.
 * Returns null if the input is falsy or the field is absent.
 *
 * [was: Vzm]
 *
 * @param {*} proto
 * @returns {TrustedResourceUrl|null}
 */
export function extractTrustedUrl(proto) { // was: Vzm
  if (!proto) return null;
  const rawUrl = getProtoField(proto, 4); // was: q6(Q, 4)
  return rawUrl === null || rawUrl === undefined
    ? null
    : toTrustedResourceUrl(rawUrl); // was: uC(Q)
}

// ============================================================================
// Script loader singleton — lines 7858-7861
// ============================================================================

/**
 * Get (or create) the script-loader singleton.
 *
 * [was: TS]
 *
 * @returns {ScriptLoaderSingleton}
 */
export function getScriptLoader() { // was: TS
  if (!ScriptLoaderSingleton.instance) { // was: KZ.instance
    ScriptLoaderSingleton.instance = new ScriptLoaderSingleton();
  }
  return ScriptLoaderSingleton.instance;
}

/**
 * Placeholder for the ScriptLoaderSingleton class (defined at line ~62614).
 * [was: KZ]
 */
class ScriptLoaderSingleton { // was: KZ
  static instance = null;
}

// ============================================================================
// Script injection — lines 7863-7927
// ============================================================================

/**
 * Load a script (or inline code), optionally under a keyed deduplication lock.
 *
 * [was: Bjd]
 *
 * @param {object}    host        - Object with `.O` (pending map) and `.W` (last loaded key).
 * @param {*}         inlineProto - Inline-script proto (or null).
 * @param {*}         srcProto    - External-script proto (or null).
 * @param {string}    [key]       - Deduplication key.
 * @returns {Promise<void>}
 */
export function loadScript(host, inlineProto, srcProto, key) { // was: Bjd
  if (!inlineProto && !srcProto) return Promise.resolve();
  if (!key) return loadScriptDirect(inlineProto, srcProto); // was: oK(c, W)
  let pending; // was: K
  (pending = host.O)[key] || (pending[key] = new Promise((resolve, reject) => {
    loadScriptDirect(inlineProto, srcProto).then(
      () => {
        host.W = key;
        resolve();
      },
      (err) => {
        delete host.O[key];
        reject(err);
      }
    );
  }));
  return host.O[key];
}

/**
 * Load a script from a challenge proto by extracting inline and src fields.
 *
 * [was: IK]
 *
 * @param {object} host
 * @param {*}      challengeProto
 * @returns {Promise<void>}
 */
export function loadScriptFromChallenge(host, challengeProto) { // was: IK
  return loadScript(
    host,
    getProtoSubMessage(challengeProto, InlineScriptType, 1, ParentType), // was: W_(c, rw, 1, xJ)
    getProtoSubMessage(challengeProto, ExternalScriptType, 2, ParentType), // was: W_(c, U9, 2, xJ)
    getProtoStringField(challengeProto, 3, undefined, ParentType) // was: Ve(c, 3, void 0, xJ)
  );
}

/**
 * Load a script directly — external (src) or inline.
 *
 * [was: oK]
 *
 * @param {*} inlineProto
 * @param {*} srcProto
 * @returns {Promise<void>}
 */
function loadScriptDirect(inlineProto, srcProto) { // was: oK
  return srcProto
    ? loadExternalScript(srcProto) // was: xnn(c)
    : inlineProto
      ? loadInlineScript(inlineProto) // was: qZ7(Q)
      : Promise.resolve();
}

/**
 * Inject an external `<script src="...">` tag and return a Promise
 * that resolves on load or rejects on error.
 *
 * [was: xnn]
 *
 * @param {*} srcProto
 * @returns {Promise<void>}
 */
function loadExternalScript(srcProto) { // was: xnn
  return new Promise((resolve, reject) => {
    const script = document.createElement("SCRIPT"); // was: g.HB("SCRIPT")
    const trustedUrl = extractTrustedUrl(srcProto); // was: Vzm(Q)
    setSrcAttribute(script, trustedUrl); // was: g.eS(m, K)
    script.onload = () => {
      removeNode(script); // was: g.FQ(m)
      resolve();
    };
    script.onerror = () => {
      removeNode(script); // was: g.FQ(m)
      reject(Error("EWLS"));
    };
    (document.getElementsByTagName("HEAD")[0] || document.documentElement).appendChild(script);
  });
}

/**
 * Inject an inline `<script>` tag with text content.
 *
 * [was: qZ7]
 *
 * @param {*} inlineProto
 * @returns {Promise<void>}
 */
function loadInlineScript(inlineProto) { // was: qZ7
  return new Promise((resolve) => {
    const script = document.createElement("SCRIPT"); // was: g.HB("SCRIPT")
    let safeScript; // was: m
    if (inlineProto) {
      let rawField = getProtoField(inlineProto, 6); // was: q6(Q, 6)
      safeScript = rawField === null || rawField === undefined
        ? null
        : toTrustedScript(rawField); // was: Uy(m)
    } else {
      safeScript = null;
    }
    script.textContent = unwrapTrustedScript(safeScript); // was: Ig(m)
    setScriptNonce(script); // was: Xt(W)
    (document.getElementsByTagName("HEAD")[0] || document.documentElement).appendChild(script);
    removeNode(script); // was: g.FQ(W)
    resolve();
  });
}

// ============================================================================
// Protobuf field setters (thin wrappers) — lines 7929-7939
// ============================================================================

/**
 * Set field 1 on a protobuf builder.
 * [was: nGm]
 */
export function setRequestField1(builder, value) { // was: nGm
  return setProtoField(builder, 1, value); // was: to(Q, 1, c)
}

/**
 * Set field 2 on a protobuf builder.
 * [was: Dn_]
 */
export function setRequestField2(builder, value) { // was: Dn_
  return setProtoField(builder, 2, value); // was: to(Q, 2, c)
}

/**
 * Set field 3 on a protobuf builder.
 * [was: tz7]
 */
export function setRequestField3(builder, value) { // was: tz7
  return setProtoField(builder, 3, value); // was: to(Q, 3, c)
}

// ============================================================================
// WAA (Web Attestation API) RPC helpers — lines 7941-7984
// ============================================================================

/**
 * Fetch a challenge token from the WAA service, decode the response,
 * and return either a parsed proto or the raw challenge message.
 *
 * [was: eu]
 *
 * @param {object}   waaClient   - WAA client with `.requestKey`, `.W()`, `.client`.
 * @param {*}        inputData   - Input data for field 2.
 * @param {*}        extraField  - Extra field for field 3.
 * @param {object}   logger      - Logger with `.K(tag, key, attempt, rpc)`.
 * @param {number}   attempt     - Attempt number.
 * @returns {Promise<*>}
 */
export async function fetchWaaChallenge(waaClient, inputData, extraField, logger, attempt) { // was: eu
  const request = setRequestField3(
    setRequestField2(setRequestField1(new RequestProto(), waaClient.requestKey), inputData), // was: new Xs
    extraField
  );
  const endpoint = waaClient.W(); // was: Q.W()
  const response = await logger.K("c", waaClient.requestKey, attempt, waaClient.client.create(request, endpoint));
  const encodedPayload = getRepeatedBytes(getSubMessage(response, 2)); // was: mS($H(Q, 2))
  if (encodedPayload.length) {
    return timedInvoke(logger, () => {
      let bytes = new Uint8Array(encodedPayload.length); // was: r
      for (let i = 0; i < encodedPayload.length; i++) {
        bytes[i] = encodedPayload[i] + 97;
      }
      if (globalThis.TextDecoder) { // was: g.qX.TextDecoder
        bytes = new TextDecoder().decode(bytes);
      } else if (bytes.length <= 8192) {
        bytes = String.fromCharCode.apply(null, bytes);
      } else {
        let str = ""; // was: U
        for (let i = 0; i < bytes.length; i += 8192) {
          str += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, i, i + 8192));
        }
        bytes = str;
      }
      return parseJsonResponse(bytes); // was: HsK(r)
    }, "U");
  }
  const challengeMessage = getProtoSubMessage(response, ChallengeMessageType, 1); // was: W_(Q, AJ, 1)
  if (!challengeMessage) throw Error("Missing field");
  return challengeMessage;
}

/**
 * Generate an integrity token via the WAA GenerateIT RPC.
 *
 * [was: xd]
 *
 * @param {object}   waaClient
 * @param {*}        payload
 * @param {object}   logger
 * @param {number}   attempt
 * @returns {Promise<*>}
 */
export async function generateIntegrityToken(waaClient, payload, logger, attempt) { // was: xd
  const endpoint = waaClient.W(); // was: K = Q.W()
  let builder = new IntegrityRequestProto(); // was: new V3
  builder = setProtoField(builder, 1, waaClient.requestKey);
  const request = setProtoField(builder, 2, payload); // was: r
  const rpcFn = logger.K; // was: c = W.K
  const requestKey = waaClient.requestKey; // was: T = Q.requestKey
  const client = waaClient.client; // was: Q = Q.client
  const rpc = createRpc(client.W, client.O + "/$rpc/google.internal.waa.v1.Waa/GenerateIT", request, rpcFn || {}, IntegrityResponseType); // was: BG(...)
  return rpcFn.call(logger, "g", requestKey, attempt, rpc);
}

/**
 * Dispatch to the appropriate challenge-fetch strategy based on client type.
 *
 * [was: is3]
 *
 * @param {object}   waaClient
 * @param {object}   logger
 * @param {number}   attempt
 * @param {*}        inputData
 * @param {*}        extraField
 * @returns {Promise<*>}
 */
export function dispatchChallengeFetch(waaClient, logger, attempt, inputData, extraField) { // was: is3
  return waaClient instanceof AttestationClient // was: qb
    ? fetchWaaChallenge(waaClient, inputData, extraField, logger, attempt)
    : fetchWaaChallenge(waaClient, inputData, extraField, new NoOpLogger(), 0); // was: new WG
}

// ============================================================================
// Attestation lifecycle — lines 7986-8047
// ============================================================================

/**
 * Main attestation/challenge refresh loop. Runs indefinitely until disposed,
 * retrying with exponential backoff on failure.
 *
 * [was: F1O]
 *
 * @param {object}  controller    - State controller with `.W`, `.isPaused`, `.u0()`, `.options`, `.handleError`, etc.
 * @param {object}  challengeClient - WAA client.
 * @param {*}       [initialChallenge] - Pre-fetched challenge, if any.
 * @param {object}  [scriptLoader=getScriptLoader()] - Script loader singleton.
 * @param {Promise} [readyPromise=Promise.resolve(undefined)]
 * @param {object}  config        - Timing/retry configuration.
 */
export async function runAttestationLoop(controller, challengeClient, initialChallenge, scriptLoader = getScriptLoader(), readyPromise = Promise.resolve(undefined), config) { // was: F1O
  await 0; // yield to microtask
  let activeInstance; // was: r
  for (;;) {
    let snapshotError = null; // was: U
    if (activeInstance) {
      setAttestationState(controller, 7); // was: nZ(Q, 7)
      try {
        snapshotError = await raceWithTimeout(
          activeInstance.snapshot({}),
          config.HW,
          () => Promise.resolve("E:CTO")
        );
      } catch (_err) {
        snapshotError = "E:UCE";
      }
    }
    let newInstance; // was: I
    const backoff = new ExponentialBackoff( // was: new g.V2
      activeInstance ? config.jA : config.Mh,
      config.Qe,
      config.getAriaLabel,
      config.getProximaPreference
    );
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) { // was: A
      if (attempt !== 1) {
        setAttestationState(controller, 0); // was: nZ(Q, 0)
        controller.W = new PausableTimer(backoff.getValue(), config.EB, config.uF); // was: new tJ(...)
        const timerResult = await controller.W.promise; // was: e
        controller.W = undefined;
        if (timerResult === 1) {
          attempt = 1;
          backoff.reset(); // was: X.reset()
        } else {
          advanceBackoff(backoff); // was: g.BO(X)
        }
      }
      try {
        let challenge; // was: e
        if (initialChallenge) {
          challenge = initialChallenge;
        } else {
          setAttestationState(controller, 5); // was: nZ(Q, 5)
          challenge = await raceWithTimeout(
            dispatchChallengeFetch(challengeClient, controller.logger, attempt, scriptLoader.W, snapshotError),
            config.readEmsgByte,
            () => Promise.reject(Error("RGF:Fetch timed out"))
          );
        }
        setAttestationState(controller, 3); // was: nZ(Q, 3)
        await raceWithTimeout(
          loadScriptFromChallenge(scriptLoader, challenge),
          config.getConnection,
          () => Promise.reject(Error("DTZ:Script timed out"))
        );
        setAttestationState(controller, 8); // was: nZ(Q, 8)
        await readyPromise;
        const handler = new ChallengeHandler({ // was: new HG
          challenge: challenge,
          fetchAttestationChallenge: controller.options.fetchAttestationChallenge,
          mS: controller.options.mS,
        });
        await raceWithTimeout(
          handler.XQ,
          config.w$,
          () => Promise.reject(Error("QEG:Setup timed out"))
        );
        newInstance = handler;
        break;
      } catch (err) {
        controller.handleError(err);
        resetPendingDeferred(controller); // was: Nb(Q)
      }
    }
    if (controller.u0()) break;
    if (newInstance) {
      initialChallenge = undefined;
      disposeOldInstance(controller, activeInstance); // was: yAR(Q, r)
      activeInstance = newInstance;
      activateNewInstance(controller, newInstance); // was: SZO(Q, I)
      resetPendingDeferred(controller); // was: Nb(Q)
    }
    setAttestationState(controller, 2); // was: nZ(Q, 2)
    controller.W = new PausableTimer(config.logAdEventWithSlotLayout, config.EB, config.uF);
    if (controller.isPaused) controller.W.pause();
    await controller.W.promise;
    controller.W = undefined;
    if (controller.u0()) break;
  }
  activeInstance?.dispose();
}

// ============================================================================
// Attestation disposal — lines 8049-8063
// ============================================================================

/**
 * Cancel and tear down an attestation controller.
 *
 * [was: Zs0]
 *
 * @param {object} controller
 */
export function disposeAttestation(controller) { // was: Zs0
  controller.J = Error("Cancelled by dispose");
  controller.K.resolve();
  suppressPromise(controller.D.promise); // was: vs(Q.D.promise)
  controller.D.reject(Error("Cancelled by dispose"));
  controller.logger.dispose();
  Promise.all(controller.j).then(async () => {
    controller.A?.dispose();
    controller.A = undefined;
  });
  controller.j = [];
  controller.W?.O();
  suppressPromise(controller.O.promise); // was: vs(Q.O.promise)
  controller.O.reject(Error("Cancelled by dispose"));
}

// ============================================================================
// Attestation resume — lines 8066-8071
// ============================================================================

/**
 * Resume a paused attestation, cancelling any pending timer, and
 * await the next completion cycle.
 *
 * [was: EGW]
 *
 * @param {object} controller
 * @returns {Promise<void>}
 */
export async function resumeAttestation(controller) { // was: EGW
  if (controller.u0()) throw Error("Already disposed");
  controller.W?.O(); // cancel timer
  await controller.O.promise;
}

// ============================================================================
// Attestation helpers — lines 8073-8102
// ============================================================================

/**
 * Append an additional dispose callback.
 * [was: s_x]
 */
export function appendDisposeCallback(controller, callback) { // was: s_x
  const prev = controller.xe; // was: W
  controller.xe = () => {
    prev();
    callback();
  };
}

/**
 * Activate a newly-created attestation handler instance.
 * [was: SZO]
 */
function activateNewInstance(controller, instance) { // was: SZO
  if (controller.u0()) return;
  controller.A = instance;
  controller.logger.update(instance.Bt());
  controller.K.resolve();
  controller.D.resolve(undefined); // was: Q.D.resolve(void 0)
  controller.xe();
}

/**
 * Dispose the previous attestation handler after pending work completes.
 * [was: yAR]
 */
function disposeOldInstance(controller, oldInstance) { // was: yAR
  if (oldInstance) {
    Promise.all(controller.j).then(() => void oldInstance.dispose());
    controller.j = [];
  }
}

/**
 * Update the attestation state label and invoke the optional state callback.
 * [was: nZ]
 */
function setAttestationState(controller, state) { // was: nZ
  controller.L = state;
  controller.options.dK2?.(state);
}

/**
 * Reset the pending-deferred on the controller (resolve the current one
 * and replace it with a fresh Deferred).
 * [was: Nb]
 */
function resetPendingDeferred(controller) { // was: Nb
  if (controller.u0()) return;
  controller.O.resolve();
  controller.O = new NativeDeferred(); // was: new g.id
}

// ============================================================================
// raceWithTimeout — lines 8104-8112
// ============================================================================

/**
 * Race a promise against a timeout. If the timeout fires first,
 * invoke `timeoutFn` and use its result. The losing branch is cleaned up.
 *
 * [was: Da]
 *
 * @param {Promise}  promise    - The main promise.
 * @param {number}   timeoutMs  - Timeout in milliseconds.
 * @param {Function} timeoutFn  - Factory for the timeout result/rejection.
 * @returns {Promise}
 */
export function raceWithTimeout(promise, timeoutMs, timeoutFn) { // was: Da
  let timerId; // was: m
  const timeoutPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, timeoutMs);
  }).then(timeoutFn);
  suppressPromise(timeoutPromise); // was: vs(W)
  return Promise.race([
    promise.finally(() => void clearTimeout(timerId)),
    timeoutPromise,
  ]);
}

// ============================================================================
// PausableTimer helpers — lines 8114-8122
// ============================================================================

/**
 * Start (or restart) a pausable timer by setting its end time and starting
 * the internal tick.
 *
 * [was: dnm]
 *
 * @param {object} timer - PausableTimer instance.
 * @param {number} durationMs
 */
export function startPausableTimer(timer, durationMs) { // was: dnm
  timer.endTimeMs = Date.now() + durationMs;
  timer.tick();
}

/**
 * Cancel the internal timeout of a pausable timer.
 *
 * [was: y3]
 *
 * @param {object} timer
 */
export function clearPausableTimer(timer) { // was: y3
  if (timer.W) {
    clearTimeout(timer.W);
    timer.W = null;
  }
}

// ============================================================================
// Session storage helper — lines 8124-8131
// ============================================================================

/**
 * Try to write a key/value pair to `sessionStorage`.
 * Returns true on success, false if the write throws.
 *
 * [was: Su]
 *
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
export function sessionStorageSet(key, value) { // was: Su
  try {
    globalThis.sessionStorage.setItem(key, value);
    return true; // was: !0
  } catch (_err) {
    return false; // was: !1
  }
}

// ============================================================================
// Hashing utilities — lines 8133-8170
// ============================================================================

/**
 * Compute a hash (similar to Java's String.hashCode) over a range
 * of a string or byte array, optionally chaining from a previous hash.
 *
 * [was: Fs]
 *
 * @param {string|Uint8Array} data
 * @param {number} [start=0]
 * @param {number} [end=data.length]
 * @param {number} [seed] - Previous hash to chain from.
 * @returns {number} 32-bit signed integer hash.
 */
export function hashRange(data, start = 0, end = data.length, seed) { // was: Fs
  let hash = 0; // was: K
  if (seed) {
    hash = hashRange(seed); // was: Fs(m) — recursive call with seed as "data"
  }
  for (; start < end; start++) {
    hash = Math.imul(31, hash) + (typeof data === "string" ? data.charCodeAt(start) : data[start]) | 0; // was: L17(31, K) + ...
  }
  return hash;
}

/**
 * Compute a hex fingerprint of a string by splitting it in half
 * and hashing each half (second half seeded with the MAGIC constant).
 *
 * [was: E9]
 *
 * @param {string} str
 * @returns {string} Hex hash string.
 */
export function hexFingerprint(str) { // was: E9
  const [createTimeRanges, hi] = [
    hashRange(str, 0, str.length >> 1, SESSION_MAGIC), // was: Fs(Q, 0, Q.length >> 1, Za)
    hashRange(str, str.length >> 1),
  ];
  return createTimeRanges.toString(16) + hi.toString(16);
}

/**
 * Apply a block-cipher-like scramble to a Uint8Array using a string key.
 * Operates in-place on the buffer viewed as Uint32Array.
 *
 * [was: s9]
 *
 * @param {Uint8Array} data
 * @param {string}     key
 */
export function scrambleBuffer(data, key) { // was: s9
  const keyHashes = [
    hashRange(key, 0, key.length >> 1, undefined), // was: Fs(c, 0, c.length >> 1, void 0)
    hashRange(key, key.length >> 1),
  ];
  const u32 = new Uint32Array(data.buffer); // was: Q = new Uint32Array(Q.buffer)
  const base = u32[0]; // was: c = Q[0]
  const [seedA, seedB] = keyHashes; // was: [m, K]
  for (let i = 1; i < u32.length; i += 2) { // was: W = 1
    let a = base; // was: T
    let b = i; // was: r
    let sA = seedA; // was: U
    let sB = seedB; // was: I
    for (let round = 0; round < 22; round++) { // was: X
      b = b >>> 8 | b << 24;
      b += a | 0;
      b ^= sA + 38293;
      a = a << 3 | a >>> 29;
      a ^= b;
      sB = sB >>> 8 | sB << 24;
      sB += sA | 0;
      sB ^= round + 38293;
      sA = sA << 3 | sA >>> 29;
      sA ^= sB;
    }
    const pair = [a, b]; // was: T = [T, r]
    u32[i] ^= pair[0];
    if (i + 1 < u32.length) {
      u32[i + 1] ^= pair[1];
    }
  }
}

/**
 * Magic bytes used as a session-storage signature / seed.
 * [was: Za]  (defined at line ~62760)
 */
const SESSION_MAGIC = [196, 200, 224, 18]; // was: Za

// ============================================================================
// Session-storage encryption — lines 8172-8208
// ============================================================================

/**
 * Encrypt data and store it in sessionStorage.
 *
 * [was: wBw]
 *
 * @param {object}     host     - Object with `.ll(key, removeFn)` lock method.
 * @param {string}     storageKey
 * @param {Uint8Array} payload
 * @param {string}     secret
 * @param {number}     expiryTimestamp
 * @returns {string} Status code: "s" (stored), "t" (store failed), "i" (lock failed).
 */
export function encryptAndStore(host, storageKey, payload, secret, expiryTimestamp) { // was: wBw
  const padding = (4 - (SESSION_MAGIC.length + payload.length) % 4) % 4; // was: T
  const buffer = new Uint8Array(4 + padding + SESSION_MAGIC.length + 4 + payload.length); // was: r
  const view = new DataView(buffer.buffer); // was: U
  let offset = 0; // was: I
  view.setUint32(offset, Math.random() * 4294967295);
  offset = offset + 4 + padding;
  buffer.set(SESSION_MAGIC, offset);
  offset += SESSION_MAGIC.length;
  view.setUint32(offset, expiryTimestamp);
  buffer.set(payload, offset + 4);
  scrambleBuffer(buffer, secret); // was: s9(r, m)
  return host.ll(storageKey, (k) => void globalThis.sessionStorage.removeItem(k))
    ? sessionStorageSet(storageKey, base64Encode(buffer)) // was: g.lj(r)
      ? "s"
      : "t"
    : "i";
}

/**
 * Read and decrypt data from sessionStorage.
 * Returns a two-element array: [statusCode, data?].
 *
 * [was: bs7]
 *
 * @param {string} storageKey
 * @param {string} secret
 * @returns {[string]|[string, Uint8Array]} Status + optional decrypted payload.
 */
export function readAndDecrypt(storageKey, secret) { // was: bs7
  const raw = globalThis.sessionStorage.getItem(storageKey); // was: W
  if (!raw) return ["m"]; // missing
  let decoded; // was: m
  try {
    decoded = base64Decode(raw); // was: CN(W)
    scrambleBuffer(decoded, secret); // was: s9(m, c)
  } catch (_err) {
    globalThis.sessionStorage.removeItem(storageKey);
    return ["c"]; // corrupt
  }
  // Skip random prefix padding
  let idx = 4; // was: c = 4
  while (idx < 7 && decoded[idx] === 0) idx++;
  // Verify magic signature
  for (let j = 0; j < SESSION_MAGIC.length; j++) {
    if (decoded[idx++] !== SESSION_MAGIC[j]) {
      globalThis.sessionStorage.removeItem(storageKey);
      return ["d"]; // bad signature
    }
  }
  const expiry = new DataView(decoded.buffer).getUint32(idx); // was: W
  if (Math.floor(Date.now() / 1e3) >= expiry) {
    globalThis.sessionStorage.removeItem(storageKey);
    return ["e"]; // expired
  }
  return ["a", new Uint8Array(decoded.buffer, idx + 4)]; // active
}

// ============================================================================
// Session-storage index — lines 8210-8223
// ============================================================================

/**
 * Load (or create) a session-storage index object from the well-known
 * key "iU5q-!O9@$".
 *
 * [was: j_d]
 *
 * @param {number} maxSlots
 * @returns {object} A SessionIndex (dw) instance.
 */
export function loadSessionIndex(maxSlots) { // was: j_d
  const raw = globalThis.sessionStorage.getItem("iU5q-!O9@$"); // was: c
  if (!raw) return new SessionIndex(maxSlots); // was: new dw(Q)
  const parts = raw.split(","); // was: W
  if (parts.length < 2) {
    globalThis.sessionStorage.removeItem("iU5q-!O9@$");
    return new SessionIndex(maxSlots);
  }
  let entries = parts.slice(1); // was: c
  if (entries.length === 1 && entries[0] === "") entries = [];
  const cursor = Number(parts[0]); // was: W
  if (isNaN(cursor) || cursor < 0 || cursor > entries.length) {
    globalThis.sessionStorage.removeItem("iU5q-!O9@$");
    return new SessionIndex(maxSlots);
  }
  return new SessionIndex(maxSlots, cursor, entries); // was: new dw(Q, W, c)
}

// ============================================================================
// Jenkins hash (lookup3) — lines 8225-8306
// ============================================================================

/**
 * Compute a Jenkins lookup3 hash of a string.
 * Returns an encoded string via the Osy base-62 encoder.
 *
 * [was: fJd]
 *
 * @param {string} input
 * @returns {string}
 */
export function jenkinsHash(input) { // was: fJd
  function mix() { // was: c (inner)
    a -= b; a -= c; a ^= c >>> 13;
    b -= c; b -= a; b ^= a << 8;
    c -= a; c -= b; c ^= b >>> 13;
    a -= b; a -= c; a ^= c >>> 12;
    b -= c; b -= a; b ^= a << 16;
    c -= a; c -= b; c ^= b >>> 5;
    a -= b; a -= c; a ^= c >>> 3;
    b -= c; b -= a; b ^= a << 10;
    c -= a; c -= b; c ^= b >>> 15;
  }

  const bytes = stringToCharCodes(input); // was: gG0(Q)
  let a = 2654435769; // was: W — golden ratio constant
  let b = 2654435769; // was: m
  let c = 314159265; // was: K — pi-ish
  const totalLen = bytes.length; // was: T
  let remaining = totalLen; // was: r
  let offset = 0; // was: U

  for (; remaining >= 12; remaining -= 12, offset += 12) {
    a += readLittleEndian32(bytes, offset); // was: LZ(Q, U)
    b += readLittleEndian32(bytes, offset + 4);
    c += readLittleEndian32(bytes, offset + 8);
    mix();
  }
  c += totalLen;

  /* falls through intentionally */
  switch (remaining) {
    case 11: c += bytes[offset + 10] << 24; // eslint-disable-line no-fallthrough
    case 10: c += bytes[offset + 9] << 16;  // eslint-disable-line no-fallthrough
    case 9:  c += bytes[offset + 8] << 8;   // eslint-disable-line no-fallthrough
    case 8:  b += bytes[offset + 7] << 24;  // eslint-disable-line no-fallthrough
    case 7:  b += bytes[offset + 6] << 16;  // eslint-disable-line no-fallthrough
    case 6:  b += bytes[offset + 5] << 8;   // eslint-disable-line no-fallthrough
    case 5:  b += bytes[offset + 4];        // eslint-disable-line no-fallthrough
    case 4:  a += bytes[offset + 3] << 24;  // eslint-disable-line no-fallthrough
    case 3:  a += bytes[offset + 2] << 16;  // eslint-disable-line no-fallthrough
    case 2:  a += bytes[offset + 1] << 8;   // eslint-disable-line no-fallthrough
    case 1:  a += bytes[offset + 0];
  }
  mix();
  return base62Encode(c); // was: Osy.toString(K)
}

/**
 * Convert a string to an array of char codes.
 *
 * [was: gG0]
 *
 * @param {string} str
 * @returns {number[]}
 */
function stringToCharCodes(str) { // was: gG0
  const codes = [];
  for (let i = 0; i < str.length; i++) {
    codes.push(str.charCodeAt(i));
  }
  return codes;
}

/**
 * Read a 32-bit little-endian integer from a byte array at the given offset.
 *
 * [was: LZ]
 *
 * @param {number[]} bytes
 * @param {number}   offset
 * @returns {number}
 */
function readLittleEndian32(bytes, offset) { // was: LZ
  return bytes[offset + 0] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] << 24);
}

/**
 * Base-62 encoder for hash values (offsets by 2^31 to handle signed ints).
 * [was: Osy]  (defined at line ~62806)
 */
const base62Encode = (function () { // was: Osy.toString
  const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ALNUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return function base62Encode(value) {
    const chars = [];
    let idx = 0;
    value -= -2147483648; // unsigned offset
    chars[idx++] = ALPHA.charAt(value % 52);
    for (value = Math.floor(value / 52); value > 0; ) {
      chars[idx++] = ALNUM.charAt(value % 62);
      value = Math.floor(value / 62);
    }
    return chars.join("");
  };
})();

// ============================================================================
// Attestation token TTL timer — lines 8308-8313
// ============================================================================

/**
 * Set a timeout on a disposable that resolves its internal deferred (`.j`)
 * after `durationMs`. Clears the timeout on dispose.
 *
 * [was: ww]
 *
 * @param {object} disposable - Object with `.j.resolve()` and `.addOnDisposeCallback()`.
 * @param {number} durationMs
 */
export function setExpiryTimer(disposable, durationMs) { // was: ww
  const timerId = setTimeout(() => {
    disposable.j.resolve();
  }, durationMs);
  disposable.addOnDisposeCallback(() => void clearTimeout(timerId));
}

// ============================================================================
// Error serializer — lines 8316-8328
// ============================================================================

/**
 * Serialize an error into a compact binary format for transmission.
 *
 * [was: ju]
 *
 * @param {object}   entry   - Object with `.error` ({message, stack, code}).
 * @param {Function} truncFn - String truncation/encoding function.
 * @returns {Uint8Array}
 */
export function serializeError(entry, truncFn) { // was: ju
  let encoded = `${truncFn(entry.error.message)}:${truncFn(entry.error.stack)}`.substring(0, 2048);
  const len = encoded.length + 1; // was: c
  encoded = encodeUtf8(encoded); // was: bd(W)
  const result = new Uint8Array(4 + encoded.length); // was: m
  result.set([42, len & 127 | 128, len >> 7, entry.error.code]);
  result.set(encoded, 4);
  return result;
}

/**
 * Encode a string to UTF-8 bytes, using TextEncoder when available.
 *
 * [was: bd]
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
export function encodeUtf8(str) { // was: bd
  return globalThis.TextEncoder
    ? new TextEncoder().encode(str)
    : legacyEncodeUtf8(str); // was: g.Gk(Q) — polyfill path
}

// ============================================================================
// Integrity token generation dispatcher — lines 8330-8332
// ============================================================================

/**
 * Dispatch integrity-token generation based on client type.
 *
 * [was: vGd]
 *
 * @param {object} waaClient
 * @param {object} logger
 * @param {*}      payload
 * @returns {Promise<*>}
 */
export function dispatchGenerateIT(waaClient, logger, payload) { // was: vGd
  return waaClient instanceof AttestationClient // was: qb
    ? generateIntegrityToken(waaClient, payload, logger, 1) // was: xd(Q, W, c, 1)
    : waaClient.FormatInfo(payload); // fallback method
}

// ============================================================================
// Attestation main execution — lines 8334-8405
// ============================================================================

/**
 * Execute a full attestation cycle: snapshot, generate token, and create
 * a result handler. Retries once on certain transient errors.
 *
 * [was: vG]
 *
 * @param {object} controller
 */
export async function executeAttestation(controller) { // was: vG
  let result = undefined; // was: c
  controller.K++;
  const completionDeferred = new NativeDeferred(); // was: new g.id
  if (controller.OG instanceof AttestationWorker) { // was: gw
    controller.OG.j.push(completionDeferred.promise);
  }
  if (controller.Ob) {
    const yieldDeferred = new NativeDeferred(); // was: new g.id
    setTimeout(() => void yieldDeferred.resolve());
    await yieldDeferred.promise;
  }
  const sharedLogger = controller.logger.share(); // was: m
  try {
    controller.state = 5;
    const interceptors = []; // was: T
    const snapshot = await raceWithTimeout(
      controller.OG.snapshot({ createFadeTransition: {}, IZ: interceptors }),
      controller.Fh.polyfillRegistry,
      () => Promise.reject(new AttestationError(15, "MDA:Timeout")) // was: new g5(15, ...)
    );
    assertNotDisposed(controller, "MDA:Disposed"); // was: O9(Q, ...)
    const interceptor = interceptors[0]; // was: U
    controller.state = 6;
    const tokenResponse = await raceWithTimeout(
      dispatchGenerateIT(controller.Fm, sharedLogger, snapshot),
      controller.Fh.Dp,
      () => Promise.reject(new AttestationError(10, "BWB:Timeout"))
    );
    assertNotDisposed(controller, "BWB:Disposed");
    controller.state = 7;
    result = timedInvoke(sharedLogger, () => {
      const handler = createResultHandler(controller, tokenResponse, completionDeferred, interceptor); // was: aJO(...)
      handler.j.promise.then(() => void controller.D());
      return handler;
    }, "i");
  } catch (err) {
    result?.dispose();
    if (!controller.O) {
      const wrappedError = wrapAttestationError(controller, err); // was: GCx(Q, T)
      completionDeferred.resolve();
      let shouldRetry; // was: K
      if ((shouldRetry = controller.OG instanceof AttestationWorker && controller.K < 2)) {
        // Original uses a labeled if: `a: if (T instanceof g5) ... else { ... break a }`
        retryCheck: if (err instanceof AttestationError) {
          shouldRetry = err.code !== 32 && err.code !== 20 && err.code !== 10;
        } else {
          if (err instanceof RpcError) { // was: fZ
            switch (err.code) {
              case 2:
              case 13:
              case 14:
              case 4:
                break;
              default:
                shouldRetry = false;
            }
          }
          shouldRetry = true;
        }
      }
      if (shouldRetry) {
        const retryDelay = setTimeout(
          () => void controller.D(),
          (1 + Math.random() * 0.25) * (controller.W ? 6e4 : 1e3)
        );
        controller.addOnDisposeCallback(() => void clearTimeout(retryDelay));
        return;
      }
      controller.O = wrappedError;
    }
    sharedLogger.Lw(controller.W ? 13 : 14);
    controller.j.reject(controller.O);
    return;
  } finally {
    sharedLogger.dispose();
  }
  controller.state = 8;
  controller.K = 0;
  controller.W?.dispose();
  controller.W = result;
  controller.j.resolve();
}

/**
 * Wrap a caught error into an AttestationError.
 * [was: GCx]
 */
function wrapAttestationError(controller, err) { // was: GCx
  if (!(err instanceof AttestationError)) { // was: g5
    if (err instanceof RpcError) { // was: fZ
      const wrapped = Error(err.toString());
      wrapped.stack = err.stack;
      err = new AttestationError(11, "EBH:Error", wrapped);
    } else {
      err = new AttestationError(12, "BSO:Unknown", err);
    }
  }
  return controller.reportError(err);
}

/**
 * Assert the controller is not disposed; throw if it is.
 * [was: O9]
 */
function assertNotDisposed(controller, message) { // was: O9
  if (controller.u0()) {
    throw new AttestationError(controller.W ? 20 : 32, message);
  }
}

/**
 * Create a result handler from the token response.
 * [was: aJO]
 */
function createResultHandler(controller, response, completionDeferred, interceptor) { // was: aJO
  const ttlMs = (getDoubleField(getSubField(response, 2)) ?? 0) * 1e3; // was: ($J(dD(c, 2)) ?? 0) * 1E3
  if (ttlMs <= 0) throw new AttestationError(31, "TTM:Invalid");
  if (getProtoStringField(response, 4)) {
    return new StaticTokenHandler(controller.logger, getProtoStringField(response, 4), ttlMs); // was: new $n7(...)
  }
  if (!(getDoubleField(getSubField(response, 3)) ?? 0)) {
    return new FixedBytesHandler(controller.logger, getRepeatedBytes(getSubMessage(response, 1)), ttlMs); // was: new PIW(...)
  }
  if (!interceptor) throw new AttestationError(4, "PMD:Undefined");
  const transformFn = interceptor(getRepeatedBytes(getSubMessage(response, 1))); // was: m(mS($H(c, 1)))
  if (typeof transformFn !== "function") throw new AttestationError(16, "APF:Failed");
  controller.J = Math.floor((Date.now() + ttlMs) / 1e3);
  const handler = new DynamicTokenHandler(controller.logger, transformFn, getDoubleField(getSubField(response, 3)) ?? 0, ttlMs); // was: new aK(...)
  handler.addOnDisposeCallback(() => void completionDeferred.resolve());
  return handler;
}

// ============================================================================
// Token signing / dispatching — lines 8442-8532
// ============================================================================

/**
 * Sign a request payload using the current attestation state.
 *
 * [was: $d]
 *
 * @param {object} controller
 * @param {object} request   - Request descriptor with `.PK`, `.xS`, `.W9`, `.iB`, `.yc` flags.
 * @param {boolean} encode   - Whether to base64-encode the result.
 * @returns {*}
 */
export function signRequest(controller, request, encode) { // was: $d
  try {
    if (controller.u0()) throw new AttestationError(21, "BNT:disposed");
    if (!controller.W && controller.O) throw controller.O;
    return signWithActiveHandler(controller, request, encode)
      ?? signFromCache(controller, request, encode)
      ?? signWithFallback(controller, request, encode);
  } catch (err) {
    if (!request.PK) throw wrapAndReport(controller, err); // was: GS(Q, m)
    return signWithErrorFallback(controller, encode, err); // was: zRx(Q, c, W)
  }
}

/**
 * Wrap an error into an AttestationError and report it.
 * [was: GS]
 */
function wrapAndReport(controller, err) { // was: GS
  const wrapped = err instanceof AttestationError ? err : new AttestationError(5, "TVD:error", err);
  return controller.reportError(wrapped);
}

/**
 * Try to sign using the active handler (`.W`).
 * [was: lJx]
 */
function signWithActiveHandler(controller, request, encode) { // was: lJx
  return controller.W?.isPS3(
    () => getRequestPayload(controller, request), // was: PG(Q, c)
    encode,
    (signed) => {
      if (controller.W instanceof DynamicTokenHandler && request.xS?.OZ) { // was: aK
        try {
          controller.cache?.W(
            getRequestPayload(controller, request),
            signed,
            request.xS.PV,
            controller.J - 120
          );
        } catch (err) {
          controller.reportError(new AttestationError(24, "ELX:write", err));
        }
      }
    }
  );
}

/**
 * Try to read a cached signed payload.
 * [was: uQK]
 */
function signFromCache(controller, request, encode) { // was: uQK
  if (request.xS?.O4) {
    try {
      const cached = controller.cache?.O(getRequestPayload(controller, request), request.xS.PV);
      return cached
        ? encode
          ? timedInvoke(controller.logger, () => base64Encode(cached, 2), "a") // was: g.lj(m, 2)
          : cached
        : undefined;
    } catch (err) {
      controller.reportError(new AttestationError(23, "RXO:read", err));
    }
  }
}

/**
 * Sign using a one-shot fallback handler (for when the real handler isn't ready).
 * [was: hRn]
 */
function signWithFallback(controller, request, encode) { // was: hRn
  const env = { stack: [], error: undefined, hasError: false }; // was: m
  try {
    if (!request.yc) throw new AttestationError(29, "SDF:notready");
    return usingDisposable(env, new FallbackHandler(controller.logger, 0, controller.state)) // was: g0(m, new ld(...))
      .isPS3(() => getRequestPayload(controller, request), encode);
  } catch (err) {
    env.error = err;
    env.hasError = true;
  } finally {
    cleanupDisposable(env); // was: OO(m)
  }
}

/**
 * Sign with an error-reporting fallback (when PK is set and signing failed).
 * [was: zRx]
 */
function signWithErrorFallback(controller, encode, err) { // was: zRx
  const env = { stack: [], error: undefined, hasError: false };
  try {
    const reportedErr = wrapAndReport(controller, err); // was: GS(Q, W)
    return usingDisposable(env, new ErrorHandler(controller.logger, reportedErr)) // was: g0(m, new CI3(...))
      .isPS3(() => [], encode);
  } catch (innerErr) {
    env.error = innerErr;
    env.hasError = true;
  } finally {
    cleanupDisposable(env);
  }
}

/**
 * Get or lazily compute the request payload bytes.
 * [was: PG]
 */
function getRequestPayload(controller, request) { // was: PG
  return request.W9
    ? request.W9
    : request.createFadeTransition
      ? timedInvoke(controller.logger, () => (request.W9 = encodeUtf8(request.createFadeTransition)), "c") // was: bd(c.iB)
      : [];
}

/**
 * Create a one-shot signer factory (closure over a counter and logger).
 * [was: ud]
 */
export function createOneOffSigner() { // was: ud
  let counter = 0; // was: Q
  let logger; // was: c
  return (input) => {
    if (!logger) logger = new NoOpLogger(); // was: new WG
    const handler = new FallbackHandler(logger, counter, 1); // was: new ld(c, Q, 1)
    const result = handler.isPS3(() => encodeUtf8(input), true);
    handler.dispose();
    counter++;
    return result;
  };
}

// ============================================================================
// Attestation client factory — lines 8534-8536
// ============================================================================

/**
 * Create an attestation orchestrator (Mzy instance).
 *
 * [was: JAO]
 *
 * @param {*}      client
 * @param {object} [options={}]
 * @returns {object}
 */
export function createAttestationOrchestrator(client, options = {}) { // was: JAO
  return new AttestationOrchestrator(client, options); // was: new Mzy(Q, c)
}

// ============================================================================
// gRPC stream wiring — lines 8538-8637
// ============================================================================

/**
 * Wire up a streaming gRPC XHR to dispatch data/end/error events
 * to the appropriate callback arrays.
 *
 * [was: RR0]
 *
 * @param {object} rpcCall - Object with `.D` (event source), `.xhr`, `.J` (deserializer),
 *                           `.O` (data cbs), `.K` (status cbs), `.A` (end cbs), `.W` (error cbs),
 *                           `.j` (metadata cbs).
 */
export function wireStreamCallbacks(rpcCall) { // was: RR0
  rpcCall.D.Dn("data", (chunk) => { // was: Q.D.Dn("data", c => { ... })
    if ("1" in chunk) {
      const rawData = chunk["1"]; // was: W
      let parsed; // was: m
      try {
        parsed = rpcCall.J(rawData); // deserialize
      } catch (err) {
        emitRpcError(rpcCall, new RpcError(13, `Error when deserializing response data; error: ${err}, response: ${rawData}`));
      }
      if (parsed) emitData(rpcCall, parsed);
    }
    if ("2" in chunk) {
      const status = parseRpcStatus(rpcCall, chunk["2"]); // was: CZ(Q, c["2"])
      for (let i = 0; i < rpcCall.K.length; i++) {
        rpcCall.K[i](status);
      }
    }
  });

  rpcCall.D.Dn("end", () => {
    emitMetadata(rpcCall, collectResponseHeaders(rpcCall)); // was: Mb(Q, JJ(Q))
    for (let i = 0; i < rpcCall.A.length; i++) {
      rpcCall.A[i]();
    }
  });

  rpcCall.D.Dn("error", () => {
    if (rpcCall.W.length === 0) return;
    let NetworkErrorCode = rpcCall.xhr.O; // was: c
    if (NetworkErrorCode === 0 && !isXhrSuccess(rpcCall.xhr)) NetworkErrorCode = 6; // was: zQ(Q.xhr)
    let httpStatus = -1; // was: W
    let grpcCode; // was: m
    switch (NetworkErrorCode) {
      case 0:  grpcCode = 2;  break;
      case 7:  grpcCode = 10; break;
      case 8:  grpcCode = 4;  break;
      case 6:
        httpStatus = rpcCall.xhr.getStatus();
        grpcCode = httpStatusToGrpcCode(httpStatus);
        break;
      default: grpcCode = 14;
    }
    emitMetadata(rpcCall, collectResponseHeaders(rpcCall));
    let message = xhrErrorDescription(NetworkErrorCode) + ", error: " + rpcCall.xhr.getLastError(); // was: K1d(c)
    if (httpStatus !== -1) message += `, http status code: ${httpStatus}`;
    emitRpcError(rpcCall, new RpcError(grpcCode, message));
  });
}

/**
 * Emit an RPC error to all registered error callbacks.
 * [was: hJ]
 */
function emitRpcError(rpcCall, error) { // was: hJ
  for (let i = 0; i < rpcCall.W.length; i++) {
    rpcCall.W[i](error);
  }
}

/**
 * Emit metadata (response headers) to all registered metadata callbacks.
 * [was: Mb]
 */
function emitMetadata(rpcCall, metadata) { // was: Mb
  for (let i = 0; i < rpcCall.j.length; i++) {
    rpcCall.j[i](metadata);
  }
}

/**
 * Collect all response headers from the underlying XHR.
 * [was: JJ]
 *
 * @returns {object} Plain object of header name → value.
 */
function collectResponseHeaders(rpcCall) { // was: JJ
  const headers = {}; // was: c
  const allHeaders = getAllResponseHeaders(rpcCall.xhr); // was: g.RY(Q.xhr)
  Object.keys(allHeaders).forEach((key) => {
    headers[key] = allHeaders[key];
  });
  return headers;
}

/**
 * Emit deserialized data to all registered data callbacks.
 * [was: zS]
 */
function emitData(rpcCall, data) { // was: zS
  for (let i = 0; i < rpcCall.O.length; i++) {
    rpcCall.O[i](data);
  }
}

/**
 * Parse the gRPC status trailer from a raw string.
 * [was: CZ]
 *
 * @param {object} rpcCall
 * @param {string} raw
 * @returns {{code: number, details: *, metadata: object}}
 */
function parseRpcStatus(rpcCall, raw) { // was: CZ
  let code = 2; // was: W
  let details; // was: m
  const metadata = {}; // was: K
  try {
    const parsed = decodeRpcStatus(raw); // was: kCw(c)
    code = getInt32Field(parsed, 1); // was: g.Ao(T, 1)
    details = parsed.getMessage();
    if (getRepeatedSubMessages(parsed, StatusDetailType, 3).length) { // was: Tp(T, YZR, 3)
      metadata["grpc-web-status-details-bin"] = raw;
    }
  } catch (err) {
    if (rpcCall.xhr && rpcCall.xhr.getStatus() === 404) {
      code = 5;
      details = "Not Found: " + String(rpcCall.xhr.L);
    } else {
      code = 14;
      details = `Unable to parse RpcStatus: ${err}`;
    }
  }
  return { code, details, metadata };
}

// ============================================================================
// Unary RPC helper — lines 8639-8676
// ============================================================================

/**
 * Wire up a unary (non-streaming) gRPC call over XHR.
 *
 * [was: Qaw]
 *
 * @param {object}  rpcCall  - Same shape as in wireStreamCallbacks.
 * @param {boolean} isBase64 - Whether the response is base64-encoded text/plain.
 */
export function wireUnaryRpc(rpcCall, isBase64) { // was: Qaw
  const stackCapture = new RpcStackCapture(); // was: new pBw
  listenOnce(rpcCall.xhr, "complete", () => { // was: g.s7(Q.xhr, "complete", () => { ... })
    if (isXhrSuccess(rpcCall.xhr)) { // was: zQ(Q.xhr)
      let body = getResponseText(rpcCall.xhr); // was: g.MA(Q.xhr)
      if (isBase64 && rpcCall.xhr.getResponseHeader("Content-Type") === "text/plain") {
        if (!atob) throw Error("Cannot decode Base64 response");
        body = atob(body);
      }
      let parsed; // was: K
      try {
        parsed = rpcCall.J(body);
      } catch (err) {
        emitRpcError(rpcCall, attachStack(new RpcError(13, `Error when deserializing response data; error: ${err}, response: ${body}`), stackCapture));
        return;
      }
      const grpcCode = httpStatusToGrpcCode(rpcCall.xhr.getStatus()); // was: m
      emitMetadata(rpcCall, collectResponseHeaders(rpcCall));
      if (grpcCode === 0) {
        emitData(rpcCall, parsed);
      } else {
        emitRpcError(rpcCall, attachStack(new RpcError(grpcCode, "Xhr succeeded but the status code is not 200"), stackCapture));
      }
    } else {
      let body = getResponseText(rpcCall.xhr); // was: m
      let grpcCode; // was: r (reused K)
      let responseHeaders = collectResponseHeaders(rpcCall); // was: K
      if (body) {
        const status = parseRpcStatus(rpcCall, body); // was: T
        grpcCode = status.code;
        const details = status.details; // was: r
        const statusMeta = status.metadata; // was: T
        // Note: original re-assigns body/grpcCode/details from status
        emitMetadata(rpcCall, responseHeaders);
        emitRpcError(rpcCall, attachStack(new RpcError(grpcCode, details, statusMeta), stackCapture));
      } else {
        grpcCode = 2;
        const details = `Rpc failed due to xhr error. uri: ${String(rpcCall.xhr.L)}, error code: ${rpcCall.xhr.O}, error: ${rpcCall.xhr.getLastError()}`;
        emitMetadata(rpcCall, responseHeaders);
        emitRpcError(rpcCall, attachStack(new RpcError(grpcCode, details, responseHeaders), stackCapture));
      }
    }
  });
}

/**
 * Remove an element from an array by value.
 * [was: kd]
 *
 * @param {Array} arr
 * @param {*}     value
 */
export function removeFromArray(arr, value) { // was: kd
  const idx = arr.indexOf(value);
  if (idx > -1) arr.splice(idx, 1);
}

/**
 * Attach a captured stack trace to an RpcError for debugging.
 * [was: RK]
 *
 * @param {RpcError} error
 * @param {Error}    stackSource
 * @returns {RpcError}
 */
function attachStack(error, stackSource) { // was: RK
  if (stackSource.stack) {
    error.stack += "\n" + stackSource.stack;
  }
  return error;
}

// ============================================================================
// XHR config wrapper — line 8688-8692
// ============================================================================

/**
 * Configuration wrapper for XHR-based transports.
 *
 * [was: g.Yd]
 *
 * @param {object} config - Object with `.Zg` (factory) and `.Ac` (streaming flag).
 */
export class XhrConfig { // was: g.Yd
  constructor(config) {
    /** @type {?XmlHttpFactory} [was: j] */
    this.factory = config.SlotIdFulfilledEmptyTrigger || null; // was: Q.Zg
    /** @type {boolean} [was: A] */
    this.useStreaming = config.Ac || false; // was: Q.Ac || !1
    /** @type {*} [was: O] */
    this.O = undefined; // was: void 0
  }
}

// ====================== LINES 8694-8725: FetchXhr (SKIPPED) =================

// ============================================================================
// Collection utilities — lines 8727-8776
// ============================================================================

/**
 * Extract all values from a collection (Map, Set, array-like, or
 * object with a `.z$()` method).
 *
 * [was: c4d]
 *
 * @param {*} collection
 * @returns {Array}
 */
export function getValues(collection) { // was: c4d
  if (collection.z$ && typeof collection.z$ === "function") {
    return collection.z$();
  }
  if (typeof Map !== "undefined" && collection instanceof Map ||
      typeof Set !== "undefined" && collection instanceof Set) {
    return Array.from(collection.values());
  }
  if (typeof collection === "string") {
    return collection.split("");
  }
  if (isArrayLike(collection)) { // was: g.iw(Q)
    const result = [];
    const len = collection.length;
    for (let i = 0; i < len; i++) {
      result.push(collection[i]);
    }
    return result;
  }
  return objectValues(collection); // was: gZ(Q)
}

/**
 * Extract all keys from a collection.
 *
 * [was: Wl7]
 *
 * @param {*} collection
 * @returns {Array|undefined}
 */
export function getKeys(collection) { // was: Wl7
  if (collection.Il && typeof collection.Il === "function") {
    return collection.Il();
  }
  if (!collection.z$ || typeof collection.z$ !== "function") {
    if (typeof Map !== "undefined" && collection instanceof Map) {
      return Array.from(collection.keys());
    }
    if (!(typeof Set !== "undefined" && collection instanceof Set)) {
      if (isArrayLike(collection) || typeof collection === "string") { // was: g.iw(Q)
        const keys = [];
        const len = collection.length;
        for (let i = 0; i < len; i++) {
          keys.push(i);
        }
        return keys;
      }
      return objectKeys(collection); // was: g.Ov(Q)
    }
  }
}

/**
 * Iterate over a collection, calling `callback(value, key, collection)`
 * for each entry.
 *
 * [was: mfm]
 *
 * @param {*}        collection
 * @param {Function} callback
 * @param {*}        [context]
 */
export function forEach(collection, callback, context) { // was: mfm
  if (collection.forEach && typeof collection.forEach === "function") {
    collection.forEach(callback, context);
  } else if (isArrayLike(collection) || typeof collection === "string") { // was: g.iw(Q)
    Array.prototype.forEach.call(collection, callback, context);
  } else {
    const keys = getKeys(collection); // was: Wl7(Q)
    const values = getValues(collection); // was: c4d(Q)
    const len = values.length;
    for (let i = 0; i < len; i++) {
      callback.call(context, values[i], keys && keys[i], collection);
    }
  }
}

// ============================================================================
// Shared "suppressed promise" utility  (referenced from multiple places)
// ============================================================================

/**
 * Suppress unhandled-rejection warnings on a promise by attaching
 * empty then/catch handlers.
 *
 * [was: vs]  (line ~6371)
 *
 * @param {Promise} promise
 */
export function suppressPromise(promise) { // was: vs
  promise.then(() => {}, () => {});
}

// ============================================================================
// ClosurePromise (g.RF) — forward declarations / type aliases
// ============================================================================

// The full Closure Promise implementation spans lines 7134-7363 (constructor,
// internals, and cancellation) plus prototype methods at 61956-62009.
// It is a Thenable with cancellation support and an internal callback chain.
// A comprehensive deobfuscation is out of scope for this file but the
// key shape is documented here for reference.

/**
 * Placeholder reference for the Closure Library Promise (g.RF).
 * The real implementation is large (constructor at 7134, prototype at 61956).
 * See SYMBOL_MAP.md for the canonical mapping.
 *
 * Key properties:
 *   .W   — state (0=pending, 1=blocked, 2=fulfilled, 3=rejected)
 *   .J   — result value / rejection reason
 *   .O   — head of callback chain (kR linked list)
 *   .j   — tail of callback chain
 *   .A   — parent promise (for cancellation propagation)
 *   .D   — whether settle callbacks are scheduled
 *   .K   — unhandled-rejection flag
 *
 * Prototype methods (from ~61956):
 *   .then(onFulfilled, onRejected, context)  — standard Thenable
 *   .finally(callback)
 *   .fF(onRejected, context)  — alias for .catch()
 *   .catch = .fF
 *   .cancel(reason)           — propagate cancellation up the chain
 *   .Vn(value)                — re-resolve (for chaining)
 *   .nC(reason)               — re-reject (for chaining)
 *   .ye()                     — drain the callback queue
 *
 * [was: g.RF]
 */
class ClosurePromise {} // Stub — real implementation not duplicated here

// ============================================================================
// NativeDeferred (g.id) — lines 62478-62486
// ============================================================================

/**
 * A simple Deferred built on top of native Promise.
 * Exposes `.resolve` and `.reject` alongside the `.promise`.
 *
 * [was: g.id]
 */
export class NativeDeferred { // was: g.id
  constructor() {
    /** @type {Promise} */
    this.promise = new Promise((resolve, reject) => {
      /** @type {Function} */
      this.resolve = resolve;
      /** @type {Function} */
      this.reject = reject;
    });
  }
}

// ============================================================================
// Metric internals — referenced by the registration helpers above.
// Full class definitions live at lines 61644-61677.
// ============================================================================

/**
 * A single metric data-point value wrapper.
 * [was: dV]  (line ~61644)
 */
class MetricValue { // was: dV
  constructor(value) {
    this.W = value;
  }
}

/**
 * Base class for metric stores (histogram / counter).
 * [was: Ib7]  (line ~61650)
 */
class MetricBase { // was: Ib7
  constructor(key, type, fields) {
    this.O = key;   // metric key
    this.A = type;  // 2 = histogram, 3 = counter
    this.fields = fields || [];
    this.W = new Map();
  }
  clear() {
    this.W.clear();
  }
}

/**
 * Counter metric (type 3).
 * [was: yU]  (line ~61662)
 */
class CounterMetric extends MetricBase { // was: yU
  constructor(key, fieldSpecs) {
    super(key, 3, fieldSpecs);
  }
}

/**
 * Histogram metric (type 2).
 * [was: NA]  (line ~61668)
 */
class HistogramMetric extends MetricBase { // was: NA
  constructor(key, fieldSpecs) {
    super(key, 2, fieldSpecs);
  }
  /**
   * Record a value for the given field combination.
   * [was: Y3]
   */
  record(value, ...fieldValues) { // was: Y3
    const wrappedValues = [fieldValues];
    const existing = lookupMetricEntry(this, wrappedValues);
    if (existing) {
      existing.push(new MetricValue(value));
    } else {
      this.W.set(compositeKey([wrappedValues]), [new MetricValue(value)]);
    }
  }
}

// ============================================================================
// External references used but not defined in this file.
// These are placeholders showing what the original code calls.
// ============================================================================

/* External stubs — implementations live in other deobfuscated modules.
 *
 * lookupMetricEntry  [was: Ps]       — metric-internals (line ~6870)
 * compositeKey       [was: D4]       — metric-internals (line ~6879)
 * attachDisposable   [was: g.F]      — disposable.js
 * isArrayLike        [was: g.iw]     — type-helpers.js
 * objectValues       [was: gZ]       — object-utils.js
 * objectKeys         [was: g.Ov]     — object-utils.js
 * base64Encode       [was: g.lj]     — string-utils.js
 * base64Decode       [was: CN]       — string-utils.js
 * legacyEncodeUtf8   [was: g.Gk]     — utf8.js
 * isXhrSuccess       [was: zQ]       — network (XhrIo helpers)
 * getResponseText    [was: g.MA]     — network (XhrIo helpers)
 * getAllResponseHeaders [was: g.RY]   — network (XhrIo helpers)
 * listenOnce         [was: g.s7]     — event-handler.js
 * removeNode         [was: g.FQ]     — dom-utils.js
 * setSrcAttribute    [was: g.eS]     — dom-utils.js
 * ExponentialBackoff [was: g.V2]     — retry-policy.js
 * advanceBackoff     [was: g.BO]     — retry-policy.js
 * getProtoField      [was: q6]       — proto-helpers.js
 * setProtoField      [was: to]       — proto-helpers.js
 * parseJsonResponse  [was: HsK]     — (JSON parser)
 * decodeRpcStatus    [was: kCw]      — (proto decoder)
 *
 * Classes referenced but defined elsewhere:
 *   AttestationClient      [was: qb]  (line ~62633)
 *   AttestationWorker      [was: gw]  (line ~62644)
 *   AttestationOrchestrator [was: Mzy] (line ~63054)
 *   RpcError               [was: fZ]  (line ~62082)
 *   AttestationError       [was: g5]  (line ~60826)
 *   NoOpLogger             [was: WG]  (line ~62283)
 *   ChallengeHandler       [was: HG]  (line ~62488)
 *   PausableTimer          [was: tJ]  (line ~62719)
 *   DynamicTokenHandler    [was: aK]  (line ~62833)
 *   FixedBytesHandler      [was: PIW] (line ~62856)
 *   StaticTokenHandler     [was: $n7] (line ~62868)
 *   FallbackHandler        [was: ld]  — (integrity handler)
 *   ErrorHandler           [was: CI3] — (error-path handler)
 *   LogDispatcher          [was: cG]  (line ~62051)
 *   RpcStackCapture        [was: pBw] (line ~63138)
 *   SessionIndex           [was: dw]  — (session-storage index)
 *   AAm                    [was: AAm] (line ~62401)
 *   usingDisposable        [was: g0]  — (disposable scope helper)
 *   cleanupDisposable      [was: OO]  — (disposable scope cleanup)
 */
