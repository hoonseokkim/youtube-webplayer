/**
 * Event System — resource management, authentication, hashing, backoff,
 * and logging transport infrastructure.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 * Source lines: 4754–4772, 4990–4997, 5995–5997, 6353–6393, 6395–6453,
 *              6455–6617, 6619–6739, 6741–6881
 *
 * Contains:
 *   Resource management helpers:
 *     g.BN   (safeDispose)              line ~4754
 *     g.xE   (disposeAll)               line ~4758
 *     g.F    (registerDisposable)        line ~4770
 *
 *   Iterator infrastructure:
 *     g.OF   (AbstractIterator)          line ~4990
 *     g.f4   (iteratorResult)            line ~4992
 *
 *   Closure-style binding:
 *     XbK    (callBound)                 line ~5995
 *
 *   Promise helpers:
 *     vs     (voidSink)                  line ~6371
 *
 *   Proto field descriptor factories:
 *     ap     (int64FieldDescriptor)      line ~6377
 *     g.G_   (stringFieldDescriptor)     line ~6384
 *     ZRw    (setProtoField)             line ~6391
 *
 *   Metric proto serialization:
 *     Mj     (serializeMetricSet)        line ~6395
 *     sgO    (getFieldTypes)             line ~6866
 *     Ps     (getMetricValues)           line ~6870
 *     Ej3    (getFieldNames)             line ~6875
 *     D4     (buildCompositeKey)         line ~6879
 *
 *   Origin extraction (auth-specific):
 *     J3     (getSecureOrigin)           line ~6455
 *
 *   SHA-1 hashing:
 *     did    (createSha1)                line ~6484
 *     kN     (sha1HexDigest)            line ~6613
 *
 *   SAPISIDHASH auth token system:
 *     Rp     (buildSapisidHash)          line ~6582
 *     LkW    (computeAuthToken)          line ~6587
 *     YN     (CookieReader)              line ~6619
 *     pd     (parseCookies)              line ~6625
 *     Q2     (hasSapisidCookie)          line ~6642
 *     cO     (getCookieAuthToken)        line ~6651
 *     WO     (buildAuthorizationHeader)  line ~6656
 *
 *   User-Agent Client Hints (UACH):
 *     wbm    (setBrandList)              line ~6671
 *     bRO    (getHighEntropyUACH)        line ~6675
 *     ORd    (fetchAndStoreUACH)         line ~6730
 *
 *   Exponential backoff:
 *     g.V2   (ExponentialBackoff)        line ~6741
 *     g.BO   (incrementBackoff)          line ~6749
 *
 *   GEL (Google Event Logging) transport:
 *     xR     (getGelEndpointUrl)         line ~6755
 *     fQK    (createFlushCallback)       line ~6759
 *     qH     (sendFinalFlush)            line ~6773
 *     nW     (resolveLogUrl)             line ~6779
 *     aQm    (sendBeaconBatch)           line ~6788
 *     GYR    (buildGelRequest)           line ~6802
 *     vjO    (drainLogQueue)             line ~6823
 *     $iw    (setBuildLabel)             line ~6847
 *     lQK    (setNetworkTransport)       line ~6852
 *     utx    (setLogQueue)               line ~6857
 *     hAX    (enableLogging)             line ~6861
 *
 * @module core/event-system
 */
import { METRIC_RECORD_FIELDS } from '../proto/messages-media.js'; // was: uQ
import { OBSERVATION_RECORD_FIELDS } from '../proto/messages-media.js'; // was: Cd
import { cachedClientHints } from '../proto/messages-media.js'; // was: mZ
import { parseClientHintsJson } from '../proto/messages-media.js'; // was: gjR
import { SimpleHttpSender } from '../data/event-logging.js'; // was: Pmd
import { dispose } from '../ads/dai-cue-range.js';
import { slice } from './array-utils.js';
import { forEach } from './event-registration.js';
import { toString } from './string-utils.js';
import { defineProperty } from './polyfills.js';

// ============================================================================
// Resource management helpers
// Source lines: 4754–4772
// ============================================================================

/**
 * Safely dispose a single object if it has a `dispose` method.
 *
 * [was: g.BN] (line ~4754)
 *
 * @param {*} obj - The object to dispose (may be null/undefined).
 */
export function safeDispose(obj) { // was: g.BN
  if (obj && typeof obj.dispose === "function") {
    obj.dispose();
  }
}

/**
 * Dispose all arguments. If any argument is an array it is recursively
 * flattened and each element disposed individually.
 *
 * [was: g.xE] (line ~4758)
 *
 * @param {...*} args
 */
export function disposeAll(...args) { // was: g.xE
  for (let i = 0, len = args.length; i < len; ++i) {
    const item = args[i];
    if (Array.isArray(item)) { // was: g.iw(m)
      disposeAll.apply(null, item);
    } else {
      safeDispose(item);
    }
  }
}

/**
 * Register a child disposable so that it is automatically disposed when
 * `parent` is disposed.  Internally calls `parent.addOnDisposeCallback()`
 * with a bound call to {@link safeDispose}.
 *
 * [was: g.F] (line ~4770)
 *
 * @param {Disposable} parent [was: Q] - The owning disposable.
 * @param {*} child [was: c] - The child disposable to wire up.
 */
export function registerDisposable(parent, child) { // was: g.F
  // Original: Q.addOnDisposeCallback(g.sO(g.BN, c))
  // g.sO is Function.prototype.bind partial-apply: g.sO(fn, arg) => () => fn(arg)
  parent.addOnDisposeCallback(() => safeDispose(child)); // was: g.sO(g.BN, c)
}

// ============================================================================
// Iterator infrastructure
// Source lines: 4990–4997
// ============================================================================

/**
 * Abstract iterator base class — a no-op constructor.
 *
 * Subclasses override the `next()` method.  YouTube's internal iteration
 * protocol predates `Symbol.iterator` and uses this as the base type that
 * is checked via `instanceof`.
 *
 * [was: g.OF] (line ~4990)
 */
export class AbstractIterator { // was: g.OF
  // Intentionally empty — the original was `g.OF = function() {}`
}

/**
 * Build an iterator result object (not-done variant).
 *
 * [was: g.f4] (line ~4992)
 *
 * @param {*} value [was: Q]
 * @returns {{ value: *, done: boolean }}
 */
export function iteratorResult(value) { // was: g.f4
  return {
    value,
    done: false,
  };
}

/** Iterator done sentinel. [was: g.KP] */
export const ITERATOR_DONE = Object.freeze({ done: true, value: undefined });

// ============================================================================
// Closure-style binding
// Source line: 5995–5997
// ============================================================================

/**
 * Call a bound function through the Closure Library's internal dispatch
 * table `Bs`.  This is a generated trampoline used by the obfuscated
 * build to invoke methods by index.
 *
 * [was: XbK] (line ~5995)
 *
 * @param {*} Q - First argument.
 * @param {*} c - Second argument.
 * @returns {*}
 */
// var XbK = function(Q, c) {
//     return Bs[x[13]](this, 2, 1992, Q, c)
// };
// NOTE: This is a trampoline into the Closure dispatch table (`Bs`).
//       It cannot be meaningfully deobfuscated further without the
//       full Bs table resolution.  Preserved here for documentation.

// ============================================================================
// Promise helpers
// Source line: 6371–6375
// ============================================================================

/**
 * Suppress unhandled-rejection warnings on a promise by attaching
 * empty fulfillment and rejection handlers.
 *
 * [was: vs] (line ~6371)
 *
 * @param {Promise} promise [was: Q]
 */
export function voidSink(promise) { // was: vs
  promise.then(
    () => {},
    () => {},
  );
}

// ============================================================================
// Proto field descriptor factories
// Source lines: 6377–6393
// ============================================================================

/**
 * Create an int64 (varint) field descriptor for metric proto serialization.
 *
 * [was: ap] (line ~6377)
 *
 * @param {string} fieldName [was: Q]
 * @returns {{ fieldType: number, fieldName: string }}
 */
export function int64FieldDescriptor(fieldName) { // was: ap
  return {
    fieldType: 2,
    fieldName,
  };
}

/**
 * Create a string field descriptor for metric proto serialization.
 *
 * [was: g.G_] (line ~6384)
 *
 * @param {string} fieldName [was: Q]
 * @returns {{ fieldType: number, fieldName: string }}
 */
export function stringFieldDescriptor(fieldName) { // was: g.G_
  return {
    fieldType: 3,
    fieldName,
  };
}

/**
 * Set a proto field from a descriptor.
 *
 * [was: ZRw] (line ~6391)
 *
 * @param {*} proto [was: Q] - The proto message.
 * @param {*} descriptor [was: c] - The field descriptor.
 * @returns {*} The modified proto.
 */
export function setProtoField(proto, descriptor) { // was: ZRw
  return Pw(proto, descriptor, f3); // delegates to Pw with f3 wire-type
}

// ============================================================================
// Metric proto serialization
// Source lines: 6395–6453, 6866–6881
// ============================================================================

/**
 * Get the wire types for all fields in a metric set definition.
 *
 * [was: sgO] (line ~6866)
 *
 * @param {Object} metricDef [was: Q] - The metric definition with `fields` array.
 * @returns {number[]} Array of field type codes.
 */
export function getFieldTypes(metricDef) { // was: sgO
  return metricDef.fields.map((field) => field.fieldType); // was: c => c.fieldType
}

/**
 * Retrieve recorded metric values for a given composite key.
 *
 * [was: Ps] (line ~6870)
 *
 * @param {Object} metricDef [was: Q] - The metric definition.
 * @param {...string} keyParts [was: c] - Key components.
 * @returns {Array|undefined}
 */
export function getMetricValues(metricDef, ...keyParts) { // was: Ps
  const compositeKey = buildCompositeKey(keyParts); // was: D4(c)
  return metricDef.W.has(compositeKey)
    ? metricDef.W.get(compositeKey)
    : undefined;
}

/**
 * Get the field names from a metric set definition.
 *
 * [was: Ej3] (line ~6875)
 *
 * @param {Object} metricDef [was: Q]
 * @returns {string[]}
 */
export function getFieldNames(metricDef) { // was: Ej3
  return metricDef.fields.map((field) => field.fieldName); // was: c => c.fieldName
}

/**
 * Build a composite key by joining parts with commas.
 * Falls back to `"key"` when no arguments are provided.
 *
 * [was: D4] (line ~6879)
 *
 * @param {...string} parts [was: Q]
 * @returns {string}
 */
export function buildCompositeKey(...parts) { // was: D4
  return parts ? parts.join(",") : "key";
}

/**
 * Serialize a metric set into a proto message.
 *
 * Walks all recorded dimension-key combinations, converts each value
 * according to the field's wire type (int64/double/string/bool), and
 * packs the result into a proto batch.
 *
 * [was: Mj] (line ~6395)
 *
 * @param {Object} metricDef [was: Q] - The metric definition.
 * @returns {Object} A serialized proto message ($N).
 */
export function serializeMetricSet(metricDef) { // was: Mj
  // Create the outer proto container
  let container = new $N(); // was: var c = new $N
  container = DZ(container, 1, metricDef.O); // was: c = DZ(c, 1, Q.O)

  // Set field name list
  const fieldNames = getFieldNames(metricDef); // was: Ej3(Q)
  container = Pw(container, fieldNames, yH0); // was: c = Pw(c, W, yH0)

  const rows = []; // was: W = []
  const allKeys = []; // was: m = []

  // Collect all composite keys
  for (const key of metricDef.W.keys()) { // was: for (var K of Q.W.keys())
    allKeys.push(key.split(",")); // was: m.push(K.split(","))
  }

  for (let i = 0; i < allKeys.length; i++) { // was: for (K = 0; K < m.length; K++)
    const keyParts = allKeys[i]; // was: V = m[K]
    const fieldType = metricDef.A; // was: T = Q.A
    const values = getMetricValues(metricDef, keyParts) || []; // was: r = Ps(Q, V) || []
    const encodedValues = []; // was: U = []

    // Encode each value according to field type
    for (let j = 0; j < values.length; j++) { // was: for (var I = 0; I < r.length; I++)
      const entry = values[j]; // was: X = r[I]
      const rawValue = entry && entry.W; // was: A = X && X.W
      const valueProto = new lQ(); // was: X = new lQ

      switch (fieldType) { // was: switch (T)
        case 3: { // double
          const numericValue = Number(rawValue); // was: A = Number(A)
          if (Number.isFinite(numericValue)) {
            R6(valueProto, 1, METRIC_RECORD_FIELDS, hC(numericValue)); // was: R6(X, 1, uQ, hC(A))
          }
          break;
        }
        case 2: { // int64
          R6(valueProto, 2, METRIC_RECORD_FIELDS, L3(Number(rawValue))); // was: R6(X, 2, uQ, L3(Number(A)))
          break;
        }
      }
      encodedValues.push(valueProto); // was: U.push(X)
    }

    // Build rows: one row per value, with all dimension keys
    for (let j = 0; j < encodedValues.length; j++) { // was: for (r = 0; r < T.length; r++)
      const encodedValue = encodedValues[j]; // was: I = T[r]
      let row = new h3(); // was: U = new h3
      row = ry(row, lQ, 2, encodedValue); // was: U = ry(U, lQ, 2, I)

      const dimensionKeys = []; // was: I = []
      const fieldTypeList = getFieldTypes(metricDef); // was: X = sgO(Q)

      for (let k = 0; k < fieldTypeList.length; k++) { // was: for (A = 0; A < X.length; A++)
        let fieldWireType = fieldTypeList[k]; // was: e = X[A]
        const keyValue = keyParts[k]; // was: B = V[A]
        const dimensionProto = new z_(); // was: n = new z_

        switch (fieldWireType) { // was: switch (e)
          case 3: // string
            R6(dimensionProto, 1, OBSERVATION_RECORD_FIELDS, p3(String(keyValue))); // was: R6(n, 1, Cd, p3(String(B)))
            break;
          case 2: { // int64
            const numVal = Number(keyValue); // was: e = Number(B)
            if (Number.isFinite(numVal)) {
              R6(dimensionProto, 2, OBSERVATION_RECORD_FIELDS, aU(numVal)); // was: R6(n, 2, Cd, aU(e))
            }
            break;
          }
          case 1: // bool
            R6(dimensionProto, 3, OBSERVATION_RECORD_FIELDS, jW(keyValue === "true")); // was: R6(n, 3, Cd, jW(B === "true"))
            break;
        }
        dimensionKeys.push(dimensionProto); // was: I.push(n)
      }

      IP(row, z_, 1, dimensionKeys); // was: IP(U, z_, 1, I)
      rows.push(row); // was: W.push(U)
    }
  }

  IP(container, h3, 4, rows); // was: IP(c, h3, 4, W)
  return container;
}

// ============================================================================
// Origin extraction (auth-specific)
// Source lines: 6455–6482
// ============================================================================

/**
 * Extract the security origin from a URL, validating the protocol and
 * handling special cases (blob:, about:blank, about:srcdoc).
 *
 * Unlike the generic `getOrigin` in url-utils.js (which uses a regex
 * parser), this version is purpose-built for the SAPISIDHASH auth flow
 * and strictly validates the protocol against a whitelist.
 *
 * [was: J3] (line ~6455)
 *
 * @param {string} url [was: Q]
 * @returns {string} The origin string (e.g. "https://www.youtube.com").
 * @throws {Error} If the protocol is missing or invalid.
 */
export function getSecureOrigin(url) { // was: J3
  if (!url) return "";

  // about:blank and about:srcdoc inherit the parent's origin
  if (/^about:(?:blank|srcdoc)$/.test(url)) {
    return window.origin || "";
  }

  // Strip blob: prefix
  if (url.indexOf("blob:") === 0) {
    url = url.substring(5);
  }

  // Remove fragment and query
  url = url.split("#")[0].split("?")[0];
  url = url.toLowerCase();

  // Prepend current protocol if protocol-relative
  if (url.indexOf("//") === 0) {
    url = window.location.protocol + url;
  }

  // If still no protocol match, use the current page href
  if (!/^[\w\-]*:\/\//.test(url)) {
    url = window.location.href;
  }

  // Extract host and protocol
  let host = url.substring(url.indexOf("://") + 3);
  let slashIndex = host.indexOf("/");
  if (slashIndex !== -1) {
    host = host.substring(0, slashIndex);
  }

  const protocol = url.substring(0, url.indexOf("://"));
  if (!protocol) {
    throw Error("URI is missing protocol: " + url);
  }

  // Validate against allowed protocols
  if (
    protocol !== "http" &&
    protocol !== "https" &&
    protocol !== "chrome-extension" &&
    protocol !== "moz-extension" &&
    protocol !== "file" &&
    protocol !== "android-app" &&
    protocol !== "chrome-search" &&
    protocol !== "chrome-untrusted" &&
    protocol !== "chrome" &&
    protocol !== "app" &&
    protocol !== "devtools"
  ) {
    throw Error("Invalid URI scheme in origin: " + protocol);
  }

  // Handle non-standard ports
  let portSuffix = "";
  const colonIndex = host.indexOf(":");
  if (colonIndex !== -1) {
    const port = host.substring(colonIndex + 1);
    host = host.substring(0, colonIndex);
    if (
      (protocol === "http" && port !== "80") ||
      (protocol === "https" && port !== "443")
    ) {
      portSuffix = ":" + port;
    }
  }

  return protocol + "://" + host + portSuffix;
}

// ============================================================================
// SHA-1 hashing
// Source lines: 6484–6617
// ============================================================================

/**
 * Create a SHA-1 hasher instance with `reset`, `update`, `digest`, and
 * `hexDigest` methods.
 *
 * This is a pure-JS SHA-1 implementation used for SAPISIDHASH token
 * generation.  The hasher is stateful: call `update()` one or more
 * times, then `digest()` or `hexDigest()` to finalize.
 *
 * [was: did] (line ~6484)
 *
 * @returns {{ reset: Function, update: Function, digest: Function, hexDigest: Function }}
 */
export function createSha1() { // was: did
  const state = []; // was: K
  const block = []; // was: T
  const temp = []; // was: r
  const padding = [128]; // was: U
  for (let i = 1; i < 64; ++i) padding[i] = 0;

  let blockPos; // was: X
  let totalLength; // was: A

  function reset() { // was: Q
    state[0] = 1732584193;
    state[1] = 4023233417;
    state[2] = 2562383102;
    state[3] = 271733878;
    state[4] = 3285377520;
    totalLength = blockPos = 0;
  }

  function compress(bytes) { // was: c
    const w = temp; // was: V = r
    // Convert 64 bytes into 16 32-bit words
    for (let i = 0; i < 64; i += 4) {
      w[i / 4] =
        (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    }
    // Extend to 80 words
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = ((x << 1) | (x >>> 31)) & 4294967295;
    }

    let a = state[0]; // was: e
    let b = state[1]; // was: n
    let c = state[2]; // was: S
    let d = state[3]; // was: d
    let e = state[4]; // was: b

    for (let i = 0; i < 80; i++) {
      let f, k; // was: w, f
      if (i < 40) {
        if (i < 20) {
          f = d ^ (b & (c ^ d));
          k = 1518500249;
        } else {
          f = b ^ c ^ d;
          k = 1859775393;
        }
      } else {
        if (i < 60) {
          f = (b & c) | (d & (b | c));
          k = 2400959708;
        } else {
          f = b ^ c ^ d;
          k = 3395469782;
        }
      }

      const t =
        ((((a << 5) | (a >>> 27)) & 4294967295) + f + e + k + w[i]) & 4294967295;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) & 4294967295;
      b = a;
      a = t;
    }

    state[0] = (state[0] + a) & 4294967295;
    state[1] = (state[1] + b) & 4294967295;
    state[2] = (state[2] + c) & 4294967295;
    state[3] = (state[3] + d) & 4294967295;
    state[4] = (state[4] + e) & 4294967295;
  }

  function update(data, length) { // was: W
    if (typeof data === "string") {
      data = unescape(encodeURIComponent(data));
      const bytes = [];
      for (let i = 0, len = data.length; i < len; ++i) {
        bytes.push(data.charCodeAt(i));
      }
      data = bytes;
    }

    if (!length) length = data.length;

    let offset = 0; // was: B
    if (blockPos === 0) {
      while (offset + 64 < length) {
        compress(data.slice(offset, offset + 64));
        offset += 64;
        totalLength += 64;
      }
    }

    while (offset < length) {
      block[blockPos++] = data[offset++];
      totalLength++;
      if (blockPos === 64) {
        blockPos = 0;
        compress(block);
        while (offset + 64 < length) {
          compress(data.slice(offset, offset + 64));
          offset += 64;
          totalLength += 64;
        }
      }
    }
  }

  function digest() { // was: m
    const result = [];
    const totalBits = totalLength * 8;

    // Pad
    if (blockPos < 56) {
      update(padding, 56 - blockPos);
    } else {
      update(padding, 64 - (blockPos - 56));
    }

    // Append total bit count as big-endian 64-bit integer
    let bitCount = totalBits;
    for (let i = 63; i >= 56; i--) {
      block[i] = bitCount & 255;
      bitCount >>>= 8;
    }
    compress(block);

    // Extract hash as bytes
    let pos = 0;
    for (let i = 0; i < 5; i++) {
      for (let shift = 24; shift >= 0; shift -= 8) {
        result[pos++] = (state[i] >> shift) & 255;
      }
    }

    return result;
  }

  reset();

  return {
    reset,
    update,
    digest,
    /** [was: Rc] */
    hexDigest() { // was: Rc
      const bytes = digest();
      let hex = "";
      for (let i = 0; i < bytes.length; i++) {
        hex +=
          "0123456789ABCDEF".charAt(Math.floor(bytes[i] / 16)) +
          "0123456789ABCDEF".charAt(bytes[i] % 16);
      }
      return hex;
    },
  };
}

/**
 * Compute the hex SHA-1 digest of a string, in lowercase.
 *
 * [was: kN] (line ~6613)
 *
 * @param {string} input [was: Q]
 * @returns {string} Lowercase hex string.
 */
export function sha1HexDigest(input) { // was: kN
  const hasher = createSha1(); // was: did()
  hasher.update(input);
  return hasher.hexDigest().toLowerCase(); // was: c.Rc().toLowerCase()
}

// ============================================================================
// SAPISIDHASH auth token system
// Source lines: 6582–6669
// ============================================================================

/**
 * Build a SAPISIDHASH authentication token.
 *
 * The token format is: `<scheme> <timestamp>_<hash>[_<key-names>]`
 * where `<hash>` is SHA-1 of `"<timestamp> <sapisid> <origin> [extra...]"`.
 *
 * [was: Rp] (line ~6582)
 *
 * @param {string} sapisid [was: Q] - The SAPISID cookie value.
 * @param {string} scheme [was: c] - Auth scheme (e.g. "SAPISIDHASH").
 * @param {Array} [keyValuePairs] [was: W] - Optional key/value pair array.
 * @returns {string|null} The auth token or null if inputs are invalid.
 */
export function buildSapisidHash(sapisid, scheme, keyValuePairs) { // was: Rp
  const locationHref = String(globalThis.location.href); // was: g.qX.__SAPISID...
  return locationHref && sapisid && scheme
    ? [scheme, computeAuthToken(getSecureOrigin(locationHref), sapisid, keyValuePairs || null)].join(" ")
    : null;
}

/**
 * Compute the timestamped auth hash token.
 *
 * For simple mode (no key/value pairs): hash is SHA-1 of
 *   `"<sapisid> <origin> [extra...]"`
 * prefixed with a UNIX timestamp.
 *
 * For keyed mode: hash is SHA-1 of
 *   `"<values-joined-by-:> <timestamp> <sapisid> <origin> [extra...]"`
 * and the output includes key names appended after the hash.
 *
 * [was: LkW] (line ~6587)
 *
 * @param {string} origin [was: Q]
 * @param {string} sapisid [was: c]
 * @param {Array|null} keyValuePairs [was: W]
 * @returns {string}
 */
export function computeAuthToken(origin, sapisid, keyValuePairs) { // was: LkW
  const extra = []; // was: m — additional strings to hash (currently unused)
  let parts = []; // was: K

  // Check if keyed mode: Array.isArray(W) ? 2 : 1
  if ((Array.isArray(keyValuePairs) ? 2 : 1) === 1) {
    // Simple mode
    parts = [sapisid, origin]; // was: K = [c, Q]
    extra.forEach((item) => {
      parts.push(item);
    });
    return sha1HexDigest(parts.join(" ")); // was: kN(K.join(" "))
  }

  // Keyed mode
  const keyNames = []; // was: T
  const values = []; // was: r
  keyValuePairs.forEach((pair) => { // was: g.lw(W, function(U) { ... })
    keyNames.push(pair.key);
    values.push(pair.value);
  });

  const timestamp = Math.floor(new Date().getTime() / 1000); // was: W
  parts =
    values.length === 0
      ? [timestamp, sapisid, origin]
      : [values.join(":"), timestamp, sapisid, origin];
  extra.forEach((item) => {
    parts.push(item);
  });

  const hash = sha1HexDigest(parts.join(" ")); // was: Q = kN(K.join(" "))
  const result = [timestamp, hash]; // was: Q = [W, Q]
  if (keyNames.length !== 0) {
    result.push(keyNames.join(""));
  }
  return result.join("_");
}

/**
 * Cookie reader — wraps a document (or document-like object) to read
 * cookies by name.
 *
 * [was: YN] (line ~6619)
 */
export class CookieReader { // was: YN
  /**
   * @param {Document|{ cookie: string }} [doc] [was: Q]
   */
  constructor(doc) {
    /** @type {Document|{ cookie: string }} */
    this.doc_ = doc || { cookie: "" }; // was: this.W
  }

  /**
   * Get the value of a named cookie.
   *
   * @param {string} name
   * @returns {string|undefined}
   */
  get(name) {
    const parsed = parseCookies(this); // was: pd(Q)
    const { keys, values } = parsed;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === name) return values[i];
    }
    return undefined;
  }
}

/**
 * Parse all cookies from a {@link CookieReader} into parallel key/value
 * arrays.
 *
 * [was: pd] (line ~6625)
 *
 * @param {CookieReader} reader [was: Q]
 * @returns {{ keys: string[], values: string[] }}
 */
export function parseCookies(reader) { // was: pd
  const raw = (reader.doc_.cookie || "").split(";"); // was: Q.W.cookie
  const keys = [];
  const values = [];
  for (let i = 0; i < raw.length; i++) {
    const trimmed = raw[i].trim(); // was: K
    const eqIndex = trimmed.indexOf("="); // was: m
    if (eqIndex === -1) {
      keys.push("");
      values.push(trimmed);
    } else {
      keys.push(trimmed.substring(0, eqIndex));
      values.push(trimmed.substring(eqIndex + 1));
    }
  }
  return { keys, values };
}

/**
 * Check whether a SAPISID-like cookie is present (in globals or document).
 *
 * [was: Q2] (line ~6642)
 *
 * @returns {boolean}
 */
export function hasSapisidCookie() { // was: Q2
  let found =
    globalThis.__SAPISID ||
    globalThis.__APISID ||
    globalThis.__3PSAPISID ||
    globalThis.__1PSAPISID ||
    globalThis.__OVERRIDE_SID;

  if (found) return true;

  if (typeof document !== "undefined") {
    const reader = new CookieReader(document); // was: new YN(document)
    found =
      reader.get("SAPISID") ||
      reader.get("APISID") ||
      reader.get("__Secure-3PAPISID") ||
      reader.get("__Secure-1PAPISID");
  }

  return !!found;
}

/**
 * Get an auth token for a specific cookie, checking both global variables
 * and document cookies.
 *
 * [was: cO] (line ~6651)
 *
 * @param {string} globalName [was: Q] - Window property name (e.g. "__SAPISID").
 * @param {string} cookieName [was: c] - Cookie name (e.g. "SAPISID").
 * @param {string} scheme [was: W] - Auth scheme (e.g. "SAPISIDHASH").
 * @param {Array} [keyValuePairs] [was: m]
 * @returns {string|null}
 */
export function getCookieAuthToken(globalName, cookieName, scheme, keyValuePairs) { // was: cO
  let value = globalThis[globalName]; // was: (Q = g.qX[Q])
  if (!value && typeof document !== "undefined") {
    value = new CookieReader(document).get(cookieName); // was: (new YN(document)).get(c)
  }
  return value ? buildSapisidHash(value, scheme, keyValuePairs) : null;
}

/**
 * Build the full Authorization header value for SAPISIDHASH.
 *
 * Checks for SAPISID / APISID / __Secure-3PAPISID / __Secure-1PAPISID
 * and constructs the appropriate hash tokens.
 *
 * [was: WO] (line ~6656)
 *
 * @param {Array} [keyValuePairs] [was: Q]
 * @returns {string|null} Space-separated list of auth tokens, or null.
 */
export function buildAuthorizationHeader(keyValuePairs) { // was: WO
  const origin = getSecureOrigin(globalThis?.location.href); // was: J3(g.qX?.location.href)
  const tokens = []; // was: W

  if (hasSapisidCookie()) { // was: Q2()
    // Determine if HTTPS context
    const isSecure =
      origin.indexOf("https:") === 0 ||
      origin.indexOf("chrome-extension:") === 0 ||
      origin.indexOf("chrome-untrusted://new-tab-page") === 0 ||
      origin.indexOf("moz-extension:") === 0;

    // Try SAPISID (HTTPS) or APISID (HTTP)
    let cookieValue;
    const globalProp = isSecure ? globalThis.__SAPISID : globalThis.__APISID;
    cookieValue = globalProp;
    if (!cookieValue && typeof document !== "undefined") {
      const reader = new CookieReader(document); // was: new YN(document)
      cookieValue =
        reader.get(isSecure ? "SAPISID" : "APISID") ||
        reader.get("__Secure-3PAPISID");
    }

    const primaryToken = cookieValue
      ? buildSapisidHash(cookieValue, isSecure ? "SAPISIDHASH" : "APISIDHASH", keyValuePairs)
      : null;
    if (primaryToken) tokens.push(primaryToken);

    // Secure-only additional tokens
    if (isSecure) {
      const token1P = getCookieAuthToken(
        "__1PSAPISID",
        "__Secure-1PAPISID",
        "SAPISID1PHASH",
        keyValuePairs,
      );
      if (token1P) tokens.push(token1P);

      const token3P = getCookieAuthToken(
        "__3PSAPISID",
        "__Secure-3PAPISID",
        "SAPISID3PHASH",
        keyValuePairs,
      );
      if (token3P) tokens.push(token3P);
    }
  }

  return tokens.length === 0 ? null : tokens.join(" ");
}

// ============================================================================
// User-Agent Client Hints (UACH)
// Source lines: 6671–6739
// ============================================================================

/**
 * Default UACH high-entropy value names to request.
 * @type {string[]}
 */
const DEFAULT_UACH_HINTS = [ // was: T$
  "platform",
  "platformVersion",
  "architecture",
  "model",
  "uaFullVersion",
];

/**
 * Cached UACH promise — set on first call to prevent duplicate requests.
 * @type {Promise|null}
 */
let uachPromise = null; // was: oF

/**
 * Shared proto message holding already-known brand data.
 * @type {*}
 */
// let brandProto = mZ;  // was: mZ (module-level proto message)

/**
 * Set the brand list on the shared UACH proto.
 *
 * [was: wbm] (line ~6671)
 *
 * @param {Array} brandMessages [was: Q] - Array of KW proto messages.
 */
export function setBrandList(brandMessages) { // was: wbm
  IP(cachedClientHints, KW, 1, brandMessages); // was: IP(mZ, KW, 1, Q)
}

/**
 * Fetch high-entropy User-Agent Client Hints from the browser and return
 * a serialized proto.
 *
 * On the first call the result is cached so subsequent calls with the
 * same hint set return the same promise.
 *
 * [was: bRO] (line ~6675)
 *
 * @param {Window} win [was: Q] - The window object (for navigator.userAgentData).
 * @param {string[]} [hints] [was: c] - Hint names (defaults to DEFAULT_UACH_HINTS).
 * @returns {Promise<string>} Serialized Xh proto bytes.
 */
export function getHighEntropyUACH(win, hints = DEFAULT_UACH_HINTS) { // was: bRO
  if (!uachPromise) {
    const uaData = win.navigator?.userAgentData; // was: Q.navigator?.userAgentData
    if (
      !uaData ||
      typeof uaData.getHighEntropyValues !== "function" ||
      (uaData.brands && typeof uaData.brands.map !== "function")
    ) {
      return Promise.reject(Error("UACH unavailable"));
    }

    // Record low-entropy brand data immediately
    setBrandList(
      (uaData.brands || []).map((brand) => { // was: m
        let msg = new KW(); // was: K = new KW
        msg = DZ(msg, 1, brand.brand);
        return DZ(msg, 2, brand.version);
      }),
    );

    if (typeof uaData.mobile === "boolean") {
      wD(cachedClientHints, 2, jW(uaData.mobile));
    }

    uachPromise = uaData.getHighEntropyValues(hints); // was: oF = Q.getHighEntropyValues(c)
  }

  const requestedHints = new Set(hints); // was: W

  return uachPromise
    .then((result) => { // was: m
      const proto = cachedClientHints.clone(); // was: K = mZ.clone()

      if (requestedHints.has("platform")) DZ(proto, 3, result.platform);
      if (requestedHints.has("platformVersion")) DZ(proto, 4, result.platformVersion);
      if (requestedHints.has("architecture")) DZ(proto, 5, result.architecture);
      if (requestedHints.has("model")) DZ(proto, 6, result.model);
      if (requestedHints.has("uaFullVersion")) DZ(proto, 7, result.uaFullVersion);

      return proto.Eg(); // Serialize
    })
    .catch(() => cachedClientHints.Eg()); // Fallback to low-entropy only
}

/**
 * Fetch UACH data and store it on the logger config for subsequent requests.
 *
 * [was: ORd] (line ~6730)
 *
 * @param {Object} config [was: Q] - Logger config with `fA`, `uach` fields.
 */
export function fetchAndStoreUACH(config) { // was: ORd
  const win = config.fA ? undefined : globalThis; // was: Q.fA ? void 0 : qn()
  if (win) {
    getHighEntropyUACH(win, DEFAULT_UACH_HINTS)
      .then((serialized) => {
        config.uach = parseClientHintsJson(serialized ?? "[]"); // was: Q.uach = gjR(W ?? "[]")
        const contextProto = IF(config); // was: W = IF(Q)
        ry(contextProto, Xh, 9, config.uach);
        return true;
      })
      .catch(() => false);
  } else {
    Promise.resolve(false);
  }
}

// ============================================================================
// Exponential backoff
// Source lines: 6741–6753
// ============================================================================

/**
 * Exponential backoff calculator with optional jitter.
 *
 * Used by the heartbeat module, health monitor, and offline download manager
 * to implement retry delays that double on each failure (up to `maxDelay`).
 *
 * [was: g.V2] (line ~6741)
 */
export class ExponentialBackoff { // was: g.V2
  /**
   * @param {number} initialDelay [was: Q] - The base delay in milliseconds.
   * @param {number} maxDelay [was: c] - The maximum delay in milliseconds.
   * @param {number} [jitterFactor=0] [was: W] - Jitter factor (0 = no jitter, 1 = full).
   * @param {number} [multiplier=2] [was: m] - Growth factor per increment.
   */
  constructor(initialDelay, maxDelay, jitterFactor = 0, multiplier = 2) {
    /** @type {number} Initial (minimum) delay. */
    this.initialDelay_ = initialDelay; // was: this.j

    /** @type {number} Maximum delay cap. */
    this.maxDelay_ = maxDelay; // was: this.K

    /**
     * Current calculated delay (before jitter).
     * Starts equal to `initialDelay_`.
     * @type {number}
     */
    this.currentDelay_ = initialDelay; // was: this.W (aliased to A initially)

    /**
     * Actual delay value including jitter.
     * This is what callers read.
     * @type {number}
     */
    this.delay = initialDelay; // was: this.A

    /** @type {number} Jitter factor. */
    this.jitterFactor_ = jitterFactor; // was: this.D

    /** @type {number} Multiplicative growth factor. */
    this.multiplier_ = multiplier; // was: this.J

    /**
     * Number of times {@link increment} has been called.
     * @type {number}
     */
    this.count = 0; // was: this.O (implicitly initialized)
  }
}

/**
 * Increment the backoff: multiply the current delay by the growth factor,
 * clamp to maxDelay, then apply jitter.
 *
 * [was: g.BO] (line ~6749)
 *
 * @param {ExponentialBackoff} backoff [was: Q]
 */
export function incrementBackoff(backoff) { // was: g.BO
  backoff.currentDelay_ = Math.min(
    backoff.maxDelay_,
    backoff.currentDelay_ * backoff.multiplier_,
  );
  backoff.delay = Math.min(
    backoff.maxDelay_,
    backoff.currentDelay_ +
      (backoff.jitterFactor_
        ? Math.round(
            backoff.jitterFactor_ *
              (Math.random() - 0.5) *
              2 *
              backoff.currentDelay_,
          )
        : 0),
  );
  backoff.count++;
}

// ============================================================================
// GEL (Google Event Logging) transport
// Source lines: 6755–6865
// ============================================================================

/**
 * Get the default GEL logging endpoint URL.
 *
 * [was: xR] (line ~6755)
 *
 * @returns {string}
 */
export function getGelEndpointUrl() { // was: xR
  return "https://play.google.com/log?format=json&hasfast=true";
}

/**
 * Create a flush callback that drains the log queue.
 *
 * If `asyncSetup` is provided, the flush is deferred until the promise
 * returned by `asyncSetup()` resolves.
 *
 * [was: fQK] (line ~6759)
 *
 * @param {Object} logger [was: Q] - The GEL logger instance.
 * @param {Function} [asyncSetup] [was: c] - Optional async initializer.
 * @returns {Function} A no-arg callback that triggers flushing.
 */
export function createFlushCallback(logger, asyncSetup) { // was: fQK
  if (!logger.MM) return () => {};

  const doFlush = () => {
    logger.flush();
  };

  return asyncSetup
    ? () => {
        asyncSetup().then(doFlush);
      }
    : doFlush;
}

/**
 * Send a "final" flush — marks the payload as final, flushes, then
 * clears the final flag.
 *
 * [was: qH] (line ~6773)
 *
 * @param {Object} logger [was: Q]
 */
export function sendFinalFlush(logger) { // was: qH
  logger.A.isFinal = true; // was: Q.A.isFinal = !0
  logger.flush();
  logger.A.isFinal = false; // was: Q.A.isFinal = !1
}

/**
 * Resolve the full URL for the logging endpoint, handling relative URLs.
 *
 * [was: nW] (line ~6779)
 *
 * @param {Object} logger [was: Q]
 * @returns {string}
 */
export function resolveLogUrl(logger) { // was: nW
  if (!logger.L) logger.L = getGelEndpointUrl(); // was: Q.L || (Q.L = xR())
  try {
    return new URL(logger.L).toString();
  } catch (_e) {
    return new URL(logger.L, globalThis.location.origin).toString(); // was: qn().location.origin
  }
}

/**
 * Send queued log entries via `navigator.sendBeacon`.
 *
 * [was: aQm] (line ~6788)
 *
 * @param {Object} logger [was: Q]
 */
export function sendBeaconBatch(logger) { // was: aQm
  drainLogQueue(logger, (url, payload) => { // was: vjO(Q, (c, W) => { ... })
    const parsedUrl = new URL(url); // was: c = new URL(c)
    parsedUrl.searchParams.set("format", "json");

    let success = false; // was: m
    try {
      success = globalThis.navigator.sendBeacon(
        parsedUrl.toString(),
        payload.Eg(), // Serialize the proto
      );
    } catch { /* swallow */ }

    if (!success) {
      logger.Y = false; // was: Q.Y = !1  — beacon not supported
    }
    return success;
  });
}

/**
 * Build a full GEL request object with auth headers.
 *
 * [was: GYR] (line ~6802)
 *
 * @param {Object} logger [was: Q]
 * @param {*} body [was: c] - Serialized request body.
 * @param {string} [authToken=null] [was: W] - Authorization header value.
 * @param {boolean} [withCredentials=logger.withCredentials] [was: m]
 * @returns {{ url: string, body: *, zC: number, requestHeaders: Object, requestType: string, withCredentials: boolean, timeoutMillis: number }}
 */
export function buildGelRequest(
  logger,
  body,
  authToken = null,
  withCredentials = logger.withCredentials,
) { // was: GYR
  const headers = {}; // was: K
  const url = new URL(resolveLogUrl(logger)); // was: T = new URL(nW(Q))

  if (authToken) {
    headers.Authorization = authToken; // was: K.Authorization = W
  }

  if (logger.sessionIndex) {
    headers["X-Goog-AuthUser"] = logger.sessionIndex;
    url.searchParams.set("authuser", logger.sessionIndex);
  }

  if (logger.pageId) {
    Object.defineProperty(headers, "X-Goog-PageId", {
      value: logger.pageId,
    });
    url.searchParams.set("pageId", logger.pageId);
  }

  return {
    url: url.toString(),
    body,
    zC: 1, // was: zC: 1  — retry category
    requestHeaders: headers,
    requestType: "POST",
    withCredentials,
    timeoutMillis: logger.timeoutMillis,
  };
}

/**
 * Drain the log queue, sending batches through the provided transport
 * callback.  Processes up to 10 batches of 32 entries each.
 *
 * [was: vjO] (line ~6823)
 *
 * @param {Object} logger [was: Q]
 * @param {Function} transportFn [was: c] - `(url: string, payload) => boolean`.
 *   Returns `true` if the send succeeded.
 */
export function drainLogQueue(logger, transportFn) { // was: vjO
  if (logger.W.length === 0) return;

  const url = new URL(resolveLogUrl(logger)); // was: W = new URL(nW(Q))
  url.searchParams.delete("format");

  let authToken = logger.Rh(); // was: m = Q.Rh() — auth token getter
  if (authToken) url.searchParams.set("auth", authToken);
  url.searchParams.set("authuser", logger.sessionIndex || "0");

  for (let attempt = 0; attempt < 10 && logger.W.length; ++attempt) { // was: m = 0; m < 10
    const batch = logger.W.slice(0, 32); // was: K = Q.W.slice(0, 32)
    const payload = logger.A.build(
      batch,
      logger.j,
      logger.D,
      logger.aV,
      logger.S,
      logger.mF,
    ); // was: T = Q.A.build(K, Q.j, Q.D, Q.aV, Q.S, Q.mF)

    if (!transportFn(url.toString(), payload)) {
      ++logger.D; // was: ++Q.D  — increment failure count
      break;
    }

    // Reset counters on success
    logger.j = 0;
    logger.D = 0;
    logger.S = 0;
    logger.mF = 0;
    logger.W = logger.W.slice(batch.length);
  }

  // Stop the periodic timer if it was running
  if (logger.O.enabled) logger.O.stop(); // was: Q.O.enabled && Q.O.stop()
}

/**
 * Set the build label on a logger config object.
 *
 * [was: $iw] (line ~6847)
 *
 * @param {Object} config [was: Q]
 * @param {string} label [was: c]
 * @returns {Object} The config (for chaining).
 */
export function setBuildLabel(config, label) { // was: $iw
  config.buildLabel = label;
  return config;
}

/**
 * Initialize the network transport on a logger config.
 *
 * [was: lQK] (line ~6852)
 *
 * @param {Object} config [was: Q]
 * @returns {Object} The config (for chaining).
 */
export function setNetworkTransport(config) { // was: lQK
  config.network = new SimpleHttpSender(); // was: Q.network = new Pmd
  return config;
}

/**
 * Set the log entry queue reference on a logger.
 *
 * [was: utx] (line ~6857)
 *
 * @param {Object} logger [was: Q]
 * @param {Array} queue [was: c]
 */
export function setLogQueue(logger, queue) { // was: utx
  logger.W = queue;
}

/**
 * Enable logging on a logger (sets the `O` flag to true).
 *
 * [was: hAX] (line ~6861)
 *
 * @param {Object} logger [was: Q]
 * @returns {Object} The logger (for chaining).
 */
export function enableLogging(logger) { // was: hAX
  logger.O = true; // was: Q.O = !0
  return logger;
}
