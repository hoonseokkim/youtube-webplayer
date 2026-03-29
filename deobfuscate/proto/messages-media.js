/**
 * Protobuf — Media & Logging Message Class Definitions
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: 60994–61678
 *
 * This file covers the protobuf message classes, cookie management, gzip
 * compression, logging timer, batch-logging transport, and streamz metric
 * descriptors that sit between the client-streamz counters (~60950) and the
 * DOM event system (~61679):
 *
 *  - Simple proto messages (rA7, z_, lQ, h3, M97, JOO, $N, ko0, VW,
 *    QNW, cc3, g.Bj, KW, Xh, ea, U7, WwR, m0_, xp, KwO, yU7)
 *  - Field-ID arrays (Cd, uQ, RN7)
 *  - Complex descriptor on $N (nested sub-message schema)
 *  - Cookie manager (YN) with get/set/remove/clear
 *  - Gzip compression helper (YX_)
 *  - Logging timer (py7 — interval with drift compensation)
 *  - Client-hints constants (T$)
 *  - Batch request builder (TF0)
 *  - Exponential backoff (V2)
 *  - Batch logger transport (rcx) — dispatches to network
 *  - Fetch-based network adapter (U03)
 *  - Logger builder (Q3) + flush adapter (UnK)
 *  - Streamz metric descriptor (Ib7) + counter (yU) + histogram (NA)
 *  - Metric sample wrapper (dV)
 */

import {
  ProtoMessage,
  SLOT_ARRAY_STATE,
} from "./messages-core.js";

import {
  FIELD_DOUBLE,
  FIELD_INT64,
  FIELD_INT32,
  FIELD_BOOL,
  FIELD_STRING,
  FIELD_REPEATED_STRING,
  FIELD_REPEATED_FIXED64,
  FieldDescriptor,
  singularField,
  repeatedField,
  messageField,
  createSerializer,
  createJsonDeserializer,
  WIRE_VARINT,
  WIRE_FIXED64,
  WIRE_LENGTH_DELIMITED,
} from "./proto-helpers.js";

// ============================================================================
// Simple Proto Messages — Streamz / Logging Scaffolding (lines 60994–61047)
// ============================================================================

/**
 * Proto message for a streamz counter payload (empty wrapper).
 * [was: rA7]
 */
export class StreamzCounterProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: rA7

/**
 * Proto message — likely a measurement / observation record.
 * [was: z_]
 */
export class ObservationRecord extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: z_

/**
 * Field-ID array for ObservationRecord — fields 1, 2, 3.
 * Used as a one-of group or field-range marker.
 * [was: Cd]
 */
export const OBSERVATION_RECORD_FIELDS = [1, 2, 3]; // was: Cd

/**
 * Proto message — another record in the same one-of family.
 * [was: lQ]
 */
export class MetricRecord extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: lQ

/**
 * Field-ID array for MetricRecord — fields 1, 2, 3.
 * [was: uQ]
 */
export const METRIC_RECORD_FIELDS = [1, 2, 3]; // was: uQ

/**
 * Proto message — minimal wrapper (no custom fields).
 * [was: h3]
 */
export class GenericProtoH3 extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: h3

/**
 * Proto message — minimal wrapper.
 * [was: M97]
 */
export class GenericProtoM97 extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: M97

/**
 * Proto message — likely an event-tracking record.
 * [was: JOO]
 */
export class EventTrackingRecord extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: JOO

/**
 * Field-ID array for EventTrackingRecord — fields 1, 2, 3.
 * [was: RN7]
 */
export const EVENT_TRACKING_FIELDS = [1, 2, 3]; // was: RN7

// ============================================================================
// $N — Nested Batch Event Proto  (lines 61030–61041)
// ============================================================================

/**
 * Proto message for a batch event entry.
 * Has a method `Bn()` that reads field 3 as a repeated sub-message.
 *
 * [was: $N]
 *
 * Descriptor schema (line 61041):
 *   [0, string,
 *     [0, RN7, sub_msg, [0, string, -1, bool], sub_msg, [0, string, -1, int32, bool], sub_msg, [0, string]],
 *     repeated_string,
 *     repeated_msg,
 *     [0, repeated_msg, [0, Cd, repeated_string_packed, repeated_uint32_packed, repeated_bool_packed],
 *                       [0, uQ, repeated_int64_packed, repeated_double_packed, sub_msg, [0, repeated_msg, [0, double, int64]]]],
 *     fixed64,
 *     repeated_fixed64]
 */
export class BatchEventEntry extends ProtoMessage {
  constructor(data) {
    super(data);
  }

  /**
   * Read field 3 as a nested proto array, returning the element at `undefined`
   * index (likely the last element or a specific sub-field).
   * [was: Bn]
   */
  getNestedEntries() {
    // vw(this, 3, Qm, 3, true) reads field 3 as a repeated string-like array
    // VB(Q) validates the result
    // return Q[undefined] — returns the value at key `undefined` (quirky access)
    return undefined; // placeholder — requires framework internals (vw, VB)
  }
} // was: $N

// The serialisation spec is assigned via:
//   $N.prototype.O = Kj([0, ut, [0, RN7, zV, ...], npx, hj, ...VtX, BaX])
// This deeply nested spec encodes all sub-message relationships.

/**
 * Proto message — wrapper for a batch of BatchEventEntry instances.
 * Used by UnK.flush() to assemble a batch payload.
 * [was: ko0]
 */
export class BatchEventWrapper extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: ko0

// ============================================================================
// Cookie Manager  (lines 61048–61127)
// ============================================================================

/**
 * Cross-browser cookie read/write utility.
 * [was: YN]
 *
 * @property {Document|null} doc [was: W] — the document whose cookies we manage
 */
export class CookieManager {
  /**
   * @param {Document|null} document [was: Q]
   */
  constructor(document) {
    this.doc = document; // was: this.W
  }

  /** Check if cookies are enabled (sets and removes a test cookie). */
  isEnabled() {
    if (!globalThis.navigator?.cookieEnabled) return false;
    if (!this.isEmpty()) return true;
    this.set("TESTCOOKIESENABLED", "1", { maxAge: 60 }); // was: sz: 60
    if (this.get("TESTCOOKIESENABLED") !== "1") return false;
    this.remove("TESTCOOKIESENABLED");
    return true;
  }

  /**
   * Set a cookie.
   * [was: set]
   *
   * @param {string} name
   * @param {string} value
   * @param {Object} [options]
   * @param {string} [options.sameSite]
   * @param {boolean} [options.secure]
   * @param {string} [options.domain]
   * @param {string} [options.path]
   * @param {number} [options.maxAge] — seconds; -1 = session, 0 = delete [was: sz]
   */
  set(name, value, options) {
    let domain;
    let secure = false;
    let sameSite;
    let path;
    let maxAge;

    if (typeof options === "object") {
      sameSite = options.sameSite;
      secure = options.secure || false;
      domain = options.domain || undefined;
      path = options.path || undefined;
      maxAge = options.maxAge; // was: options.sz
    }

    if (/[;=\s]/.test(name)) {
      throw Error(`Invalid cookie name "${name}"`);
    }
    if (/[;\r\n]/.test(value)) {
      throw Error(`Invalid cookie value "${value}"`);
    }

    if (maxAge === undefined) maxAge = -1;

    const domainStr = domain ? ";domain=" + domain : "";
    const pathStr = path ? ";path=" + path : "";
    const secureStr = secure ? ";secure" : "";

    let expiresStr;
    if (maxAge < 0) {
      expiresStr = "";
    } else if (maxAge === 0) {
      expiresStr = ";expires=" + new Date(1970, 1, 1).toUTCString();
    } else {
      expiresStr =
        ";expires=" + new Date(Date.now() + maxAge * 1000).toUTCString();
    }

    const sameSiteStr = sameSite != null ? ";samesite=" + sameSite : "";
    this.doc.cookie =
      name + "=" + value + domainStr + pathStr + expiresStr + secureStr + sameSiteStr;
  }

  /**
   * Read a cookie by name.
   * [was: get]
   *
   * @param {string} name
   * @param {string} [defaultValue]
   * @returns {string|undefined}
   */
  get(name, defaultValue) {
    const prefix = name + "=";
    const parts = (this.doc.cookie || "").split(";");
    for (let i = 0; i < parts.length; i++) {
      const trimmed = parts[i].trim();
      if (trimmed.lastIndexOf(prefix, 0) === 0) {
        return trimmed.slice(prefix.length);
      }
      if (trimmed === name) return "";
    }
    return defaultValue;
  }

  /**
   * Remove a cookie.
   * [was: remove]
   * @returns {boolean} true if the cookie existed before removal
   */
  remove(name, path, domain) {
    const existed = this.get(name) !== undefined;
    this.set(name, "", { maxAge: 0, path, domain });
    return existed;
  }

  /** Get all cookie names. [was: Il] */
  keys() {
    return parseCookies(this).keys;
  }

  /** Get all cookie values. [was: z$] */
  values() {
    return parseCookies(this).values;
  }

  /** Whether there are no cookies. [was: isEmpty] */
  isEmpty() {
    return !this.doc.cookie;
  }

  /** Remove all cookies. [was: clear] */
  clear() {
    const names = parseCookies(this).keys;
    for (let i = names.length - 1; i >= 0; i--) {
      this.remove(names[i]);
    }
  }
} // was: YN

/**
 * Parse all cookies into { keys, values } arrays.
 * [was: pd]
 */
function parseCookies(manager) {
  const keys = [];
  const values = [];
  const raw = (manager.doc.cookie || "").split(";");
  for (let i = 0; i < raw.length; i++) {
    const pair = raw[i].trim();
    const eq = pair.indexOf("=");
    if (eq >= 0) {
      keys.push(pair.substring(0, eq));
      values.push(pair.substring(eq + 1));
    }
  }
  return { keys, values };
}

/** Default cookie manager instance (document-level). [was: AE] */
export const defaultCookieManager = new CookieManager(
  typeof document === "undefined" ? null : document
); // was: AE

// ============================================================================
// Gzip Compression Helper  (lines 61128–61141)
// ============================================================================

/**
 * Uses the browser's `CompressionStream` API to gzip-compress a string.
 * [was: YX_]
 */
export class GzipCompressor {
  /**
   * Compress a string payload to a gzipped Uint8Array.
   * [was: compress]
   *
   * @param {string} payload
   * @returns {Promise<Uint8Array>}
   */
  async compress(payload) {
    const cs = new CompressionStream("gzip");
    const resultPromise = new Response(cs.readable).arrayBuffer();
    const writer = cs.writable.getWriter();
    await writer.write(new TextEncoder().encode(payload));
    await writer.close();
    return new Uint8Array(await resultPromise);
  }

  /**
   * Whether gzip compression is available and worthwhile for the given size.
   * [was: isSupported]
   *
   * @param {number} payloadSize — byte length
   * @returns {boolean}
   */
  isSupported(payloadSize) {
    return payloadSize < 1024
      ? false
      : typeof CompressionStream !== "undefined";
  }
} // was: YX_

// ============================================================================
// Experiment ID Proto  (line 61142–61146)
// ============================================================================

/**
 * Proto message holding experiment IDs for a logging batch.
 * [was: VW]
 */
export class ExperimentIdList extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: VW

// ============================================================================
// Logging Timer  (lines 61148–61188)
// ============================================================================

/**
 * Self-correcting interval timer that compensates for drift.
 * Uses `setTimeout` internally (not `setInterval`).
 *
 * [was: py7]
 *
 * @property {number}   intervalMs — target interval (ms)
 * @property {Function} callback   — function to call each tick
 * @property {boolean}  enabled    — whether the timer is active
 * @property {Function} clockFn    [was: W] — returns current time (g.d0)
 * @property {number}   lastTick   [was: O] — timestamp of last tick
 * @property {number|undefined} timer — setTimeout handle
 */
export class DriftCorrectingTimer {
  /**
   * @param {number}   intervalMs [was: Q]
   * @param {Function} callback   [was: c]
   */
  constructor(intervalMs, callback) {
    this.intervalMs = intervalMs;
    this.callback = callback;
    this.enabled = false;        // was: !1
    this.clockFn = () => Date.now(); // was: () => g.d0()
    this.lastTick = this.clockFn();  // was: this.O = this.W()
  }

  /**
   * Update the interval; restarts the timer if running.
   * [was: setInterval]
   */
  setInterval(sendPostRequest) {
    this.intervalMs = sendPostRequest;
    if (this.timer && this.enabled) {
      this.stop();
      this.start();
    } else if (this.timer) {
      this.stop();
    }
  }

  /** Start the timer. [was: start] */
  start() {
    this.enabled = true;
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.tick();
      }, this.intervalMs);
      this.lastTick = this.clockFn();
    }
  }

  /** Stop the timer. [was: stop] */
  stop() {
    this.enabled = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Internal tick handler — fires the callback or reschedules if
   * the elapsed time is less than 80% of the interval (drift compensation).
   * [was: tick]
   */
  tick() {
    if (this.enabled) {
      const elapsed = Math.max(this.clockFn() - this.lastTick, 0);
      if (elapsed < this.intervalMs * 0.8) {
        // Fired too early — reschedule for the remaining time
        this.timer = setTimeout(() => {
          this.tick();
        }, this.intervalMs - elapsed);
      } else {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = undefined;
        }
        this.callback();
        if (this.enabled) {
          this.stop();
          this.start();
        }
      }
    } else {
      this.timer = undefined;
    }
  }
} // was: py7

// ============================================================================
// Logging Proto Messages  (lines 61190–61271)
// ============================================================================

/**
 * Proto message — wraps a numeric field (e.g. a token or retry identifier).
 * [was: QNW]
 */
export class RetryTokenProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: QNW

/**
 * Proto message — container for RetryTokenProto.
 * [was: cc3]
 */
export class RetryInfoProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: cc3

/**
 * Proto message — network info (has `.oa()` to read field 1 as int).
 * Attached to `g.Bj` in the original.
 *
 * [was: g.Bj]
 *
 * `.oa()` reads field 1 via B_(this, 1) — returns the network type enum.
 * `.WY` = c3(1) — a setter for field 1.
 */
export class NetworkInfoProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }

  /**
   * Get the network type from field 1.
   * [was: oa]
   * @returns {number}
   */
  getNetworkType() {
    // B_(this, 1) reads field 1 as an integer
    return this.NetworkStatusManager[1] || 0;
  }
} // was: g.Bj

/**
 * Proto message — opaque wrapper (possibly a scheduler hint).
 * [was: KW]
 */
export class SchedulerHintProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: KW

/**
 * Proto message — client-hints / UA data.
 * A JSON deserializer is generated: gjR = Td(Xh).
 *
 * [was: Xh]
 */
export class ClientHintsProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: Xh

/** JSON deserializer for ClientHintsProto. [was: gjR] */
export const parseClientHintsJson = createJsonDeserializer(ClientHintsProto); // was: gjR = Td(Xh)

/**
 * Proto message — extended client-hints entry.
 * [was: ea]
 */
export class ClientHintsEntryProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: ea

/**
 * Client-hints property names requested via `navigator.userAgentData.getHighEntropyValues()`.
 * [was: T$]
 */
export const CLIENT_HINTS_PROPERTIES = [
  "platform",
  "platformVersion",
  "architecture",
  "model",
  "uaFullVersion",
]; // was: T$

/** Cached instance of ClientHintsProto. [was: mZ] */
export let cachedClientHints = new ClientHintsProto(); // was: mZ = new Xh

/** [was: oF] */
export let clientHintsPromise = null; // was: oF = null

/**
 * Proto message — device/user-agent metadata.
 * [was: U7]
 */
export class DeviceMetadataProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: U7

/**
 * Proto message — server config / request context.
 * [was: WwR]
 */
export class ServerConfigProto extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: WwR

/**
 * Proto message — outer wrapper with pivot at field 4.
 * [was: m0_]
 */
export class OuterWrapperProto extends ProtoMessage {
  constructor(data) {
    super(data, 4); // pivot = 4
  }
} // was: m0_

/**
 * Proto message — log event, the central payload for batch logging.
 * Pivot at field 37 (many optional fields).
 *
 * [was: xp]
 *
 * Methods:
 *   - `.X()` — checks whether field 7 (ServerConfigProto) is present
 *   - `.bM()` — reads field 16 as an ExperimentIdList sub-message
 */
export class LogEvent extends ProtoMessage {
  constructor(data) {
    super(data, 37); // pivot = 37
  }

  /**
   * Whether this event has a server-config sub-message at field 7.
   * [was: X]
   * @returns {boolean}
   */
  hasServerConfig() {
    const arr = this.NetworkStatusManager;
    const flags = arr[SLOT_ARRAY_STATE] | 0;
    // c_(arr, flags, WwR, 7) reads the sub-message at field 7
    return arr[7] !== undefined;
  }

  /**
   * Read the ExperimentIdList sub-message at field 16.
   * [was: bM]
   * @returns {ExperimentIdList|undefined}
   */
  getExperimentIds() {
    // W_(this, VW, 16) reads field 16 as a VW sub-message
    return this.NetworkStatusManager[16];
  }
} // was: xp

/**
 * Proto message — batch request wrapper. Pivot at field 19.
 * Has a method `.qC(value)` that sets field 2 (the log-source ID).
 *
 * [was: KwO]
 */
export class BatchRequestProto extends ProtoMessage {
  constructor(data) {
    super(data, 19); // pivot = 19
  }

  /**
   * Set the log-source field (field 2).
   * [was: qC]
   * @param {number} value
   * @returns {this}
   */
  setLogSource(value) {
    // H_(this, 2, value) sets field 2 to value
    this.NetworkStatusManager[2] = value;
    return this;
  }
} // was: KwO

// ============================================================================
// Batch Request Builder  (lines 61273–61317)
// ============================================================================

/**
 * Assembles a batch logging request from accumulated LogEvent instances.
 * Populates device info, network state, timestamps, experiment IDs, etc.
 *
 * [was: TF0]
 *
 * @property {boolean}            isWorker   [was: fA] — running in a worker context
 * @property {string|null}        locale     — document lang attribute
 * @property {Object|null}        uach       — user-agent client hints
 * @property {number}             networkType [was: O] — network type enum
 * @property {boolean}            isFinal    — whether this is the final flush
 * @property {BatchRequestProto}  request    [was: W] — the proto being built
 */
export class BatchRequestBuilder {
  /**
   * @param {number}  logSource  [was: Q] — log-source ID
   * @param {boolean} [isWorker=false] [was: c] — whether this runs in a web worker
   */
  constructor(logSource, isWorker = false) {
    this.isWorker = isWorker;       // was: this.fA = c
    this.uach = null;
    this.locale = null;
    this.networkType = 0;            // was: this.O = 0
    this.isFinal = false;            // was: this.isFinal = !1
    this.request = new BatchRequestProto(); // was: this.W = new KwO
    if (Number.isInteger(logSource)) {
      this.request.setLogSource(logSource);
    }
    if (!isWorker) {
      this.locale = document.documentElement.getAttribute("lang");
    }
    // AG(this, new U7) populates device metadata
  }

  /**
   * Set the log source.
   * [was: qC]
   */
  setLogSource(value) {
    this.request.setLogSource(value);
    return this;
  }

  /**
   * Build a complete batch request proto from accumulated events.
   * [was: build]
   *
   * @param {LogEvent[]} events       [was: Q] — the events to include
   * @param {number}     [eventCount=0] [was: c] — running event counter
   * @param {number}     [retryCount=0] [was: W] — retry counter
   * @param {number|null} [aV=null]    [was: m] — auxiliary value
   * @param {number}     [sentCount=0]  [was: K] — previously sent count
   * @param {number}     [failCount=0]  [was: T] — previously failed count
   * @returns {BatchRequestProto}
   */
  build(events, eventCount = 0, retryCount = 0, aV = null, sentCount = 0, failCount = 0) {
    // In non-worker mode: populates a NetworkInfoProto on the request
    if (!this.isWorker) {
      // Builds g.Bj with network type, isFinal flag, counts
      // and attaches it at field 10 of the device metadata
    }

    const req = this.request.clone();
    const timestamp = Date.now().toString();
    // wD(req, 4, hC(timestamp)) — sets field 4 to the timestamp string
    req.NetworkStatusManager[4] = timestamp;

    // IP(req, xp, 3, events.slice()) — sets field 3 to the events array
    req.NetworkStatusManager[3] = events.slice();

    // If aV is provided, wrap it in RetryTokenProto -> RetryInfoProto -> OuterWrapperProto
    if (aV) {
      const retryToken = new RetryTokenProto();
      retryToken.NetworkStatusManager[13] = aV; // wD(r, 13, aU(m))
      const retryInfo = new RetryInfoProto();
      retryInfo.NetworkStatusManager[2] = retryToken; // ry(r, QNW, 2, m)
      const wrapper = new OuterWrapperProto();
      wrapper.NetworkStatusManager[1] = retryInfo; // ry(r, cc3, 1, m)
      wrapper.NetworkStatusManager[2] = 9;        // H_(m, 2, 9)
      req.NetworkStatusManager[18] = wrapper;     // ry(Q, m0_, 18, m)
    }

    if (eventCount) {
      // nV(Q, 14, c) — sets field 14 to the event counter
      req.NetworkStatusManager[14] = eventCount;
    }

    return req;
  }
} // was: TF0

// ============================================================================
// Exponential Backoff (V2)  (lines 61319–61327)
// ============================================================================

// g.V2 is defined elsewhere; its prototype methods are wired here:
//   .O = 0        — retry count
//   .reset()      — resets W = A = j; O = 0
//   .getValue()   — returns this.A (the current backoff value)

// ============================================================================
// Server Response Proto  (lines 61329–61341)
// ============================================================================

/**
 * Proto message — server response with pivot at field 8.
 * Deserialized from the batch-log response JSON.
 *
 * [was: yU7]
 */
export class ServerResponseProto extends ProtoMessage {
  constructor(data) {
    super(data, 8); // pivot = 8
  }
} // was: yU7

/** JSON deserializer for ServerResponseProto. [was: ocd] */
export const parseServerResponseJson =
  createJsonDeserializer(ServerResponseProto); // was: ocd = Td(yU7)

/**
 * Extension wrapper for server-directed configuration.
 * [was: qu — new S4W(anonymous class extends Zd)]
 */
// qu is a global ExtensionWrapper instance whose inner class is anonymous.

// ============================================================================
// Batch Logger Transport  (lines 61342–61520)
// ============================================================================

/**
 * Core batch-logging transport.  Accumulates LogEvent protos, assembles
 * them into a BatchRequestProto, and dispatches via a network adapter.
 *
 * Extends `g.qK` (Disposable) in the original.
 *
 * [was: rcx]
 *
 * Key properties:
 *   - componentId       — optional component label
 *   - W (eventQueue)    — array of pending LogEvent protos
 *   - Ka (staleToken)   — last auth token that was rejected
 *   - pageId            — optional page ID
 *   - jG / b0           — throttle timestamps
 *   - experimentIds     — ExperimentIdList to attach to each event
 *   - PA (seqNum)       — monotonic sequence counter
 *   - logSource         — numeric log-source ID
 *   - A (builder)       — BatchRequestBuilder
 *   - network           — network adapter (implements send/oa)
 *   - O (sendTimer)     — DriftCorrectingTimer for send scheduling
 *   - Ie (flushTimer)   — DriftCorrectingTimer for periodic flush
 *   - K (backoff)       — exponential backoff (V2)
 *   - J (compressor)    — GzipCompressor or null
 *   - Y (hasSendBeacon) — whether navigator.sendBeacon is available
 *   - MM (hasUrlSearch) — whether URLSearchParams is available
 */
export class BatchLoggerTransport /* extends Disposable */ {
  /**
   * @param {Object} config
   * @param {number} config.logSource
   * @param {Function} [config.Rh]          — auth-token getter [was: Rh]
   * @param {string}  [config.sessionIndex]
   * @param {string}  [config.mJ]           — endpoint URL
   * @param {boolean} [config.fA]           — is worker?
   * @param {boolean} [config.hw]           — is headless?
   * @param {boolean} [config.fN]           — omit credentials?
   * @param {*}       [config.yM]           — custom flush config
   * @param {Object}  [config.network]      — network adapter
   */
  constructor(config) {
    this.componentId = "";
    this.eventQueue = [];            // was: this.W = []
    this.staleToken = "";            // was: this.Ka = ""
    this.pageId = null;
    this.throttleEnd = -1;           // was: this.jG = -1
    this.throttleStart = -1;         // was: this.b0 = -1
    this.compressor = null;          // was: this.J = null
    this.experimentIds = null;
    this.droppedCount = 0;           // was: this.j = 0
    this.retryCount = 0;             // was: this.D = 0
    this.sentCount = 0;              // was: this.S = 0
    this.failCount = 0;              // was: this.mF = 0
    this.seqNum = 1;                 // was: this.PA = 1
    this.timeoutMillis = 0;
    this.useSendBeacon = false;      // was: this.T2 = !1
    this.logSource = config.logSource;
    this.authTokenGetter = config.Rh || (() => {}); // was: this.Rh
    this.builder = new BatchRequestBuilder(config.logSource, config.fA); // was: this.A
    this.network = config.network || null;
    this.aV = config.aV || null;
    this.endpointUrl = config.mJ || null;  // was: this.L
    this.sessionIndex = config.sessionIndex || null;
    this.isHeadless = config.unregisterLidarLayout || false;
    this.logger = null;
    this.withCredentials = !config.fN;
    this.isWorker = config.fA || false;

    // Beacon detection
    this.hasSendBeacon =
      !this.isWorker &&
      typeof navigator !== "undefined" &&
      navigator.sendBeacon !== undefined; // was: this.Y

    // URLSearchParams detection
    this.hasUrlSearchParams =
      typeof URLSearchParams !== "undefined"; // was: this.MM (simplified)

    // Timers (simplified — the real impl wires up via fQK and g.V2)
    this.sendTimer = new DriftCorrectingTimer(10000, () => this.flush());     // was: this.O
    this.flushTimer = new DriftCorrectingTimer(600000, () => this.flush());   // was: this.Ie

    if (!this.isHeadless) {
      this.flushTimer.start();
    }

    if (!this.isWorker) {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") this.flush();
      });
      document.addEventListener("pagehide", () => {
        this.flush();
      });
    }
  }

  /** Tear down timers. [was: WA] */
  dispose() {
    this.flush();
    this.sendTimer.stop();
    this.flushTimer.stop();
  }

  /**
   * Dispatch a proto (either a LogEvent or something serialisable).
   * [was: dispatch]
   */
  dispatch(proto) {
    if (proto instanceof LogEvent) {
      this.log(proto);
    } else {
      try {
        const event = new LogEvent();
        const serialised = proto.toJsonString();
        event.NetworkStatusManager[8] = serialised; // DZ(event, 8, serialised)
        this.log(event);
      } catch (_e) {
        // silently drop
      }
    }
  }

  /**
   * Queue a LogEvent for the next batch send.
   * [was: log]
   */
  log(event) {
    if (!this.hasUrlSearchParams) return;

    event = event.clone();
    const seq = this.seqNum++;
    event.NetworkStatusManager[21] = seq; // nV(event, 21, seq)

    if (this.componentId) {
      event.NetworkStatusManager[26] = this.componentId; // DZ(event, 26, componentId)
    }

    // Ensure field 1 (event_time_ms) is populated
    if (event.NetworkStatusManager[1] == null) {
      event.NetworkStatusManager[1] = Number.isFinite(Date.now()) ? Date.now().toString() : "0";
    }

    // Ensure field 15 (timezone_offset) is populated
    if (event.NetworkStatusManager[15] == null) {
      event.NetworkStatusManager[15] = new Date().getTimezoneOffset() * 60;
    }

    // Attach experiment IDs at field 16
    if (this.experimentIds) {
      event.NetworkStatusManager[16] = this.experimentIds.clone();
    }

    // Cap the queue at 1000 events
    const excess = this.eventQueue.length - 1000 + 1;
    if (excess > 0) {
      this.eventQueue.splice(0, excess);
      this.droppedCount += excess;
    }

    this.eventQueue.push(event);

    if (!this.isHeadless && !this.sendTimer.enabled) {
      this.sendTimer.start();
    }
  }

  /**
   * Flush all queued events to the network.
   * [was: flush]
   *
   * @param {Function} [onSuccess]
   * @param {Function} [onError]
   */
  flush(onSuccess, onError) {
    if (this.eventQueue.length === 0) {
      onSuccess?.();
      return;
    }

    const now = Date.now();
    if (this.throttleEnd > now && this.throttleStart < now) {
      onError?.("throttled");
      return;
    }

    // Build the batch request
    const batch = this.builder.build(
      this.eventQueue,
      this.droppedCount,
      this.retryCount,
      this.aV,
      this.sentCount,
      this.failCount
    );

    const authToken = this.authTokenGetter();
    if (authToken && this.staleToken === authToken) {
      onError?.("stale-auth-token");
      return;
    }

    this.eventQueue = [];
    if (this.sendTimer.enabled) this.sendTimer.stop();
    this.droppedCount = 0;

    // Send via network adapter (placeholder)
    if (this.network) {
      this.network.send(
        batch,
        /* onSuccess */ () => {
          onSuccess?.();
          this.retryCount = 0;
        },
        /* onError */ (status) => {
          onError?.("net-send-failed", status);
          ++this.retryCount;
        }
      );
    }
  }

  /**
   * Whether a given HTTP status code is retryable.
   * [was: isRetryable]
   */
  isRetryable(status) {
    return (500 <= status && status < 600) || status === 401 || status === 0;
  }
} // was: rcx

// ============================================================================
// Fetch-Based Network Adapter  (lines 61522–61562)
// ============================================================================

/**
 * Network transport using the Fetch API with optional AbortController
 * for timeouts.
 *
 * [was: U03]
 *
 * @property {boolean} hasAbortController [was: Gp]
 */
export class FetchNetworkAdapter {
  constructor() {
    this.hasAbortController =
      typeof AbortController !== "undefined"; // was: this.Gp
  }

  /**
   * Send a request.
   * [was: send]
   *
   * @param {Object}   request   — { url, requestType, requestHeaders, body,
   *                                  withCredentials, timeoutMillis }
   * @param {Function} onSuccess — called with response text on 200
   * @param {Function} onError   — called with HTTP status on failure
   */
  async send(request, onSuccess, onError) {
    const controller = this.hasAbortController
      ? new AbortController()
      : undefined;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), request.timeoutMillis)
      : undefined;

    try {
      const response = await fetch(request.url, {
        method: request.requestType,
        headers: { ...request.requestHeaders },
        ...(request.body && { body: request.body }),
        ...(request.withCredentials && { credentials: "include" }),
        signal:
          request.timeoutMillis && controller ? controller.signal : null,
      });

      if (response.status === 200) {
        onSuccess?.(await response.text());
      } else {
        onError?.(response.status);
      }
    } catch (err) {
      switch (err?.name) {
        case "AbortError":
          onError?.(408);
          break;
        default:
          onError?.(400);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Returns the network type enum for "fetch".
   * [was: oa]
   * @returns {number} 4
   */
  getNetworkType() {
    return 4;
  }
} // was: U03

// ============================================================================
// Logger Builder  (lines 61564–61613)
// ============================================================================

/**
 * Builder that configures and constructs a BatchLoggerTransport.
 * Extends `g.qK` (Disposable) in the original.
 *
 * [was: Q3]
 */
export class LoggerBuilder /* extends Disposable */ {
  constructor() {
    this.logSource = 1828;
    this.sessionIndex = "0";
    this.endpointUrl =
      "https://play.google.com/log?format=json&hasfast=true"; // was: this.Yo
    this.network = null;
    this.buildLabel = null;
    this.componentId = "";
    this.aV = null;
    this.experimentIds = null; // was: this.W = null
    this.useSendBeacon = false; // was: this.O = !1
    this.logger = null;
    this.pageId = null;
  }

  /**
   * Opt out of sending credentials.
   * [was: fN]
   * @returns {this}
   */
  withoutCredentials() {
    this._noCredentials = true; // was: this.A = !0
    return this;
  }

  /**
   * Build and return a configured BatchLoggerTransport.
   * [was: build]
   * @returns {BatchLoggerTransport}
   */
  build() {
    if (!this.network) {
      this.network = new FetchNetworkAdapter();
    }

    const transport = new BatchLoggerTransport({
      logSource: this.logSource,
      Rh: this.authTokenGetter || (() => ""),
      sessionIndex: this.sessionIndex,
      mJ: this.endpointUrl,
      fA: false,
      unregisterLidarLayout: false,
      fN: this._noCredentials,
      yM: this.flushConfig,
      network: this.network,
    });

    if (this.buildLabel) {
      // Set field 7 on the device metadata inside the builder
    }

    transport.compressor = new GzipCompressor();

    if (this.componentId) transport.componentId = this.componentId;
    if (this.aV) transport.aV = this.aV;
    if (this.pageId) transport.pageId = this.pageId;

    if (this.experimentIds) {
      if (!transport.experimentIds) {
        transport.experimentIds = new ExperimentIdList();
      }
      // Copy experiment IDs
    }

    if (this.useSendBeacon) {
      transport.useSendBeacon = transport.hasSendBeacon;
    }

    return transport;
  }
} // was: Q3

// ============================================================================
// Flush Adapter  (lines 61615–61643)
// ============================================================================

/**
 * High-level adapter that owns a BatchLoggerTransport and provides
 * a `flush(entries)` method for batch-submitting streamz metric snapshots.
 *
 * Extends `g.qK` (Disposable) in the original.
 *
 * [was: UnK]
 */
export class LogFlushAdapter /* extends Disposable */ {
  /**
   * @param {BatchLoggerTransport} [transport] — if omitted, builds a default one
   */
  constructor(transport) {
    this.logSource = 1828;
    this.componentId = "";

    if (!transport) {
      const builder = new LoggerBuilder();
      builder.componentId = "";
      transport = builder.build();
    }

    this.transport = transport; // was: this.W = Q
  }

  /**
   * Serialize and dispatch a batch of metric snapshots, then flush.
   * [was: flush]
   *
   * @param {Array} entries — streamz metric snapshot objects
   */
  flush(entries) {
    entries = entries || [];
    if (entries.length) {
      const wrapper = new BatchEventWrapper();
      const serialized = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const proto = serializeMetricSnapshot(entry); // was: Mj(K)
        serialized.push(proto);
        entry.clear();
      }

      // IP(wrapper, $N, 1, serialized) — sets field 1 to the entries
      wrapper.NetworkStatusManager[1] = serialized;

      this.transport.dispatch(wrapper);
      this.transport.flush();
    }
  }
} // was: UnK

/**
 * Placeholder for the metric-snapshot serializer.
 * [was: Mj]
 */
function serializeMetricSnapshot(entry) {
  return new BatchEventEntry(); // simplified
}

// ============================================================================
// Metric Sample Wrapper  (lines 61644–61648)
// ============================================================================

/**
 * Wraps a single metric sample value.
 * [was: dV]
 *
 * @property {*} value [was: W]
 */
export class MetricSample {
  constructor(value) {
    this.value = value; // was: this.W = Q
  }
} // was: dV

// ============================================================================
// Streamz Metric Descriptor  (lines 61650–61677)
// ============================================================================

/**
 * Base class for client-side streamz metric descriptors.
 * [was: Ib7]
 *
 * @property {*}      source    [was: O] — metric source/registration
 * @property {number} kind      [was: A] — metric kind (2 = histogram, 3 = counter)
 * @property {Array}  fields    — field descriptors for the metric
 * @property {Map}    samples   [was: W] — accumulated samples
 */
export class MetricDescriptor {
  /**
   * @param {*}      source [was: Q]
   * @param {number} kind   [was: c]
   * @param {Array}  fields [was: W]
   */
  constructor(source, kind, fields) {
    this.source = source;      // was: this.O = Q
    this.kind = kind;          // was: this.A = c
    this.fields = fields || []; // was: this.fields = W || []
    this.samples = new Map();  // was: this.W = new Map
  }

  /** Clear all accumulated samples. [was: clear] */
  clear() {
    this.samples.clear();
  }
} // was: Ib7

/**
 * Counter metric descriptor (kind = 3).
 * [was: yU]
 */
export class CounterMetric extends MetricDescriptor {
  /**
   * @param {*}     source [was: Q]
   * @param {Array} fields [was: c]
   */
  constructor(source, fields) {
    super(source, 3, fields);
  }
} // was: yU

/**
 * Histogram / distribution metric descriptor (kind = 2).
 * Has an additional `.Y3()` method for adding observations.
 *
 * [was: NA]
 */
export class HistogramMetric extends MetricDescriptor {
  /**
   * @param {*}     source [was: Q]
   * @param {Array} fields [was: c]
   */
  constructor(source, fields) {
    super(source, 2, fields);
  }

  /**
   * Record an observation.
   * [was: Y3]
   *
   * @param {*}    value      — the observed value
   * @param {...*} fieldKeys  — field-key tuple
   */
  observe(value, ...fieldKeys) {
    const keys = [fieldKeys];
    const existing = lookupSample(this, keys);
    if (existing) {
      existing.push(new MetricSample(value));
    } else {
      this.samples.set(hashKeys([keys]), [new MetricSample(value)]);
    }
  }
} // was: NA

/**
 * Look up an existing sample bucket. Placeholder.
 * [was: Ps]
 */
function lookupSample(metric, keys) {
  return metric.samples.get(hashKeys(keys));
}

/**
 * Hash a keys tuple for Map lookup. Placeholder.
 * [was: D4]
 */
function hashKeys(keys) {
  return JSON.stringify(keys);
}
