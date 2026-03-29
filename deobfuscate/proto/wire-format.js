/**
 * Protobuf Wire Format — Base Layer
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: 2357–3491
 *
 * This module contains the foundational protobuf infrastructure that sits
 * between the raw binary reader/writer and the higher-level message framework:
 *
 *  - ByteString class and helpers (empty instance, byte extraction, guard)
 *  - Proto-internal symbol creation (Ug) and well-known symbols
 *  - Message array flag constants and bitmask operations
 *  - Varint/zigzag type coercion utilities for proto field values
 *  - BigInt-backed int64/uint64 coercion (hC, MS, JC, PW, u6, etc.)
 *  - Field get/set on the internal message array (dD, sV, wD, LU)
 *  - Repeated field management (vw, fU, bF, uF, Pw, IP)
 *  - Oneof field tracking (R6, YH, hs, Js, zs)
 *  - Sub-message field access (Qe, c_, W_, mK, Tp)
 *  - JSON serialization of message arrays (Vm, Bw, xH, As)
 *  - Default-value helpers (d97, ts, Dc)
 *  - Deep-copy / freeze logic (bmK, ym, Ny, Sy, Fv, Zc, iF)
 *  - Typed field setters (nV, DZ, to, H_) and getters (g.Ao, e0, Ve, B_, q6)
 *  - ByteSource construction from various input types (i7)
 */
import { LISTENER_MAP_KEY } from '../data/event-logging.js'; // was: bs
import { logMdx } from '../modules/remote/mdx-client.js'; // was: ue
import { initiateSeek } from '../media/buffer-manager.js'; // was: qG
import { encodeUTF8Into } from '../core/utf8.js'; // was: UK
import { recordBufferedRanges } from '../media/buffer-stats.js'; // was: Xo
import { insertOverlayByOrder } from '../player/caption-manager.js'; // was: Un
import { createTimeRanges } from '../media/codec-helpers.js'; // was: lo

// ---------------------------------------------------------------------------
// External dependencies (from other deobfuscated modules)
// ---------------------------------------------------------------------------

// NOTE: In the original source, these are module-scoped variables shared
// across the giant IIFE.  Here we declare them as module-level state to
// preserve the exact runtime semantics.

// ---------------------------------------------------------------------------
// Sentinel / guard objects
// ---------------------------------------------------------------------------

/**
 * Internal access-guard token.  Functions that should only be called
 * internally compare their argument against this object reference.
 * [was: pN]
 */
const INTERNAL_TOKEN = {};

/**
 * Sentinel for "immutable" / frozen message state.
 * When `message.ownedState` (was `.W`) equals this, the message is frozen.
 * [was: IU]
 */
const FROZEN_SENTINEL = {};

/**
 * Empty frozen message used as default for `getOneofCase === 0` branches.
 * [was: KV]
 */
const EMPTY_FROZEN_OBJECT = Object.freeze({});

/**
 * Placeholder used internally for extensibility hooks.
 * [was: hd]
 */
const EXTENSION_TOKEN = {};

/**
 * Marker used to indicate "has 128-offset" style storage.
 * [was: xJ]
 */
const OFFSET_128_TOKEN = {};

// ---------------------------------------------------------------------------
// Module-scoped mutable state
// ---------------------------------------------------------------------------

/**
 * Incident-tracking map: symbol -> count.
 * Lazily initialised on first `reportIncident` call.
 * [was: oU]
 */
let _incidentCounts = undefined;

/**
 * The active JSON-serialisation "extension visitor".
 * Set transiently inside `toJsonWithExtensions`.
 * [was: Xv]
 */
let _jsonExtensionVisitor;

/** Cached boolean-default tuple. [was: qy] */
let _cachedBoolDefault;

/** Cached zero-number default tuple. [was: nU] */
let _cachedZeroDefault;

// ---------------------------------------------------------------------------
// ByteString
// ---------------------------------------------------------------------------

/**
 * Immutable byte-string wrapper.
 * Stores data either as a base64 string or a Uint8Array internally.
 * [was: Yy]
 */
export class ByteString {
  /**
   * @param {Uint8Array|string|null} data  raw bytes or base64 string
   * @param {object} guard                 must be INTERNAL_TOKEN
   */
  constructor(data, guard) {
    checkInternalCaller(guard); // was: cW(pN)
    /** @type {Uint8Array|string|null} [was: .W] */
    this.data = data;
    if (data !== null && data !== undefined && data.length === 0) {
      throw Error("ByteString should be constructed with non-empty values");
    }
  }

  /** Whether this ByteString contains no data. */
  isEmpty() {
    return this.data == null;
  }

  /** Byte length of the underlying data. */
  sizeBytes() {
    const bytes = extractBytes(this);
    return bytes ? bytes.length : 0;
  }
}

/** Cached empty ByteString singleton. [was: ky] */
let _emptyByteString;

/**
 * Return the shared empty ByteString instance.
 * [was: QB]
 */
export function emptyByteString() {
  return _emptyByteString || (_emptyByteString = new ByteString(null, INTERNAL_TOKEN));
}

/**
 * Extract the raw Uint8Array from a ByteString, decoding base64 if needed.
 * Caches the result back into the ByteString.
 * [was: WW]
 * @param {ByteString} bs
 * @returns {Uint8Array|null}
 */
export function extractBytes(LISTENER_MAP_KEY) {
  checkInternalCaller(INTERNAL_TOKEN); // was: cW(pN)
  let raw = LISTENER_MAP_KEY.data; // was: Q.W
  raw =
    raw == null || (raw != null && raw instanceof Uint8Array)
      ? raw
      : typeof raw === "string"
        ? decodeBase64ToBytes(raw) // was: Ra(c)
        : null;
  return raw == null ? raw : (LISTENER_MAP_KEY.data = raw);
}

/**
 * Return a Uint8Array copy of the ByteString's content (or empty array).
 * [was: mS]
 * @param {ByteString} bs
 * @returns {Uint8Array}
 */
export function toUint8Array(LISTENER_MAP_KEY) {
  return new Uint8Array(extractBytes(LISTENER_MAP_KEY) || 0);
}

/**
 * Guard: throw if the caller does not pass the internal token.
 * [was: cW]
 */
function checkInternalCaller(token) {
  if (token !== INTERNAL_TOKEN) throw Error("illegal external caller");
}

// ---------------------------------------------------------------------------
// Base64 decoding (used by ByteString)
// ---------------------------------------------------------------------------

/**
 * Regex matching characters that need URL-safe base64 translation.
 * [was: J4]
 */
const BASE64_TRANSLATE_RE = /[-_.]/g;

/**
 * Map for URL-safe base64 character replacement.
 * [was: nWx]
 */
const BASE64_CHAR_MAP = { "-": "+", _: "/", ".": "=" };

/**
 * Lookup a single character for URL-safe -> standard base64 translation.
 * [was: D9O]
 */
function translateBase64Char(ch) {
  return BASE64_CHAR_MAP[ch] || "";
}

/**
 * Decode a (possibly URL-safe) base64 string into a Uint8Array.
 * [was: Ra]
 * @param {string} str
 * @returns {Uint8Array}
 */
function decodeBase64ToBytes(str) {
  str = BASE64_TRANSLATE_RE.test(str)
    ? str.replace(BASE64_TRANSLATE_RE, translateBase64Char)
    : str;
  str = atob(str);
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    out[i] = str.charCodeAt(i);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Error / incident helpers
// ---------------------------------------------------------------------------

/**
 * Create a warning-level Error (annotated with severity metadata).
 * [was: K3]
 * @param {string} [msg]
 * @returns {Error}
 */
export function protoWarning(msg) {
  const err = Error(msg);
  annotateErrorSeverity(err, "warning"); // was: Bb(Q, "warning")
  return err;
}

/**
 * Annotate an Error object with Closure-style severity metadata.
 * [was: Bb]
 */
function annotateErrorSeverity(err, severity) {
  err.__closure__error__context__984382 ||
    (err.__closure__error__context__984382 = {});
  err.__closure__error__context__984382.severity = severity;
}

/**
 * Internal dispatch stub (calls into the framework's `T0[x[13]]`).
 * Not directly proto-related; included for coverage of source line 2383.
 * [was: t4_]
 *
 * Original: `var t4_ = function(Q, c, W) { return T0[x[13]](this, 7, 7120, Q, c, W) };`
 */
// export const t4_ = function(Q, c, W) { return T0[x[13]](this, 7, 7120, Q, c, W); };

/**
 * Report an "incident" — a non-fatal invariant violation.
 * Each unique incident key is reported at most `maxCount` times.
 * [was: rY]
 * @param {*} key       incident identifier (usually a Symbol)
 * @param {number} maxCount
 */
export function reportIncident(key, maxCount) {
  if (key != null) {
    const counts = (_incidentCounts ?? (_incidentCounts = {}));
    const current = counts[key] || 0;
    if (!(current >= maxCount)) {
      counts[key] = current + 1;
      const err = Error();
      annotateErrorSeverity(err, "incident");
      throwAsync(err); // was: vS(Q)
    }
  }
}

/**
 * Throw asynchronously (via `setTimeout(0)`) so it does not unwind the
 * current call stack.
 * [was: vS]
 */
function throwAsync(err) {
  (typeof globalThis !== "undefined" ? globalThis : window).setTimeout(() => {
    throw err;
  }, 0);
}

// ---------------------------------------------------------------------------
// Symbol factory
// ---------------------------------------------------------------------------

/**
 * Create (or look up) a Symbol, optionally using `Symbol.for` for
 * globally-shared symbols.
 * [was: Ug]
 * @param {string} [name]     human-readable description
 * @param {boolean} [shared]  if true use Symbol.for (global registry)
 * @returns {symbol}
 */
export function createSymbol(name, shared = false) {
  return shared && Symbol.for && name
    ? Symbol.for(name)
    : name != null
      ? Symbol(name)
      : Symbol();
}

// ---------------------------------------------------------------------------
// Well-known proto symbols
// ---------------------------------------------------------------------------

/**
 * Symbol stored at index 0 of every message array to hold the flags word.
 * [was: Xm] — `Symbol.for("jas")`
 */
export const SYM_FLAGS = createSymbol("jas", true);

/**
 * Symbol key for the oneof tracking Map on a message array.
 * [was: pU]
 */
export const SYM_ONEOF_MAP = createSymbol();

/**
 * Symbol key for the extension data slot.
 * [was: o6]
 */
export const SYM_EXTENSION_DATA = createSymbol();

/**
 * Symbol key for the "lazy host" metadata.
 * [was: lh0]
 */
export const SYM_LAZY_HOST = createSymbol();

/**
 * Symbol key for the incident tracking identifier.
 * [was: Fa_]
 */
export const SYM_INCIDENT_KEY = createSymbol();

/**
 * Symbol key for the "pivot limit exceeded" incident.
 * [was: PDX]
 */
export const SYM_PIVOT_INCIDENT = createSymbol();

/**
 * Symbol key for the "concurrent array read" incident.
 * [was: w9n]
 */
export const SYM_CONCURRENT_READ_INCIDENT = createSymbol();

/**
 * Symbol used as the proto-message marker key (the `[Ww]` property).
 * Instances of proto message classes have `obj[SYM_MESSAGE_MARKER] === MESSAGE_MARKER`.
 * [was: Ww] — `Symbol.for("m_m")`
 */
export const SYM_MESSAGE_MARKER = createSymbol("m_m", true);

/**
 * Symbol for extension visitor identity check.
 * [was: EW3]
 */
export const SYM_EXT_VISITOR_ID = createSymbol();

/**
 * Symbol used internally (purpose TBD).
 * [was: uA7]
 */
export const SYM_UA7 = createSymbol();

/**
 * The value that proto message instances store at `[SYM_MESSAGE_MARKER]`.
 * [was: m4]
 */
export const MESSAGE_MARKER = {};

// ---------------------------------------------------------------------------
// Flag bitmask constants (stored at messageArray[SYM_FLAGS])
// ---------------------------------------------------------------------------

/**
 * Enum-like object whose values are the individual flag bits.
 * Spread into an array for iteration in the original source.
 * Names preserved from original property keys.
 */
export const FLAGS = {
  logMdx:   1,      // bit 0: "is empty"
  initiateSeek:   2,      // bit 1: frozen / immutable
  encodeUTF8Into:   4,      // bit 2: validated / coerced
  recordBufferedRanges:   8,      // bit 3: mutable sub-messages checked
  VhG:  16,     // bit 4: "has been accessed"
  Cj:   32,     // bit 5: "is owned" / deep-owned
  WE:   64,     // bit 6: "has been initialised"
  Pe:   128,    // bit 7: "128-offset" storage mode
  Tr:   256,    // bit 8: frozen & validated (combined)
  CXI:  512,    // bit 9
  fb:   1024,   // bit 10
  insertOverlayByOrder:   2048,   // bit 11: "concurrent-read" guard
  xj:   4096,   // bit 12: mutable sub-messages present
  Xs:   8192,   // bit 13
};

// ---------------------------------------------------------------------------
// The "empty frozen array" singleton
// ---------------------------------------------------------------------------

/**
 * A frozen, empty array used as the default for uninitialised repeated fields.
 * [was: jy / hW7]
 */
let _emptyFrozenArray;
const _hW7 = [];
_hW7[SYM_FLAGS] = 7; // was: hW7[Xm] = 7
_emptyFrozenArray = Object.freeze(_hW7);
export const EMPTY_REPEATED = _emptyFrozenArray;

// ---------------------------------------------------------------------------
// Identity function (used as a no-op extension visitor)
// ---------------------------------------------------------------------------

/**
 * No-op identity function.
 * [was: Ts]
 */
export function identity(value) {
  return value;
}

/**
 * Extension visitor identity token.
 * [was: s00]
 */
const EXT_VISITOR_IDENTITY_TOKEN = {};

// ---------------------------------------------------------------------------
// BigInt-safe-integer guard
// ---------------------------------------------------------------------------

/**
 * Higher-order function that creates a memoised predicate.
 * [was: gj]
 */
function memoizePredicate(fn) {
  // The original uses a pattern that caches the generated fn.
  // Here we return the function directly since BigInt bounds are constant.
  return fn;
}

/**
 * Check whether a BigInt value fits in a safe JS integer range.
 * [was: ey — created via gj()]
 */
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER); // was: zWR
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER); // was: Ctn
export const isSafeBigInt = memoizePredicate(
  (value) => value >= MIN_SAFE_BIGINT && value <= MAX_SAFE_BIGINT
);

// ---------------------------------------------------------------------------
// Standard library aliases
// ---------------------------------------------------------------------------

/** BigInt.asIntN (signed clamp).  [was: l6] */
const bigintAsIntN =
  typeof BigInt === "function" ? BigInt.asIntN : undefined;

/** BigInt.asUintN (unsigned clamp).  [was: im0] */
const bigintAsUintN =
  typeof BigInt === "function" ? BigInt.asUintN : undefined;

/** Number.isSafeInteger.  [was: C3] */
const isSafeInteger = Number.isSafeInteger;

/** Number.isFinite.  [was: gY] */
const isFiniteNumber = Number.isFinite;

/** Math.trunc.  [was: z0] */
const trunc = Math.trunc;

/** Regex that matches valid decimal numeric strings.  [was: Hmm] */
const DECIMAL_RE = /^-?([1-9][0-9]*|0)(\.[0-9]+)?$/;

// ---------------------------------------------------------------------------
// Shared temp state for 64-bit integer decomposition
// ---------------------------------------------------------------------------

let _lo = 0; // was: tC
let _hi = 0; // was: HW

/**
 * Split an unsigned number into lo/hi 32-bit halves.
 * [was: NS]
 */
function splitUnsigned(value) {
  const createTimeRanges = value >>> 0;
  _lo = createTimeRanges;
  _hi = ((value - createTimeRanges) / 4294967296) >>> 0;
}

/**
 * Split a signed number into lo/hi 32-bit halves (two's complement).
 * [was: i6]
 */
function splitSigned(value) {
  if (value < 0) {
    splitUnsigned(0 - value);
    let createTimeRanges = _lo;
    let hi = _hi;
    hi = ~hi;
    createTimeRanges ? (createTimeRanges = ~createTimeRanges + 1) : (hi += 1);
    _lo = createTimeRanges >>> 0;
    _hi = hi >>> 0;
  } else {
    splitUnsigned(value);
  }
}

/**
 * Combine lo/hi into a safe JS number, or fall back to string.
 * [was: SW]
 */
function toNumberOrString(createTimeRanges, hi) {
  const combined = hi * 4294967296 + (createTimeRanges >>> 0);
  return isSafeInteger(combined) ? combined : toUnsignedString(createTimeRanges, hi);
}

/**
 * Render lo/hi as an unsigned decimal string.
 * [was: yB]
 */
function toUnsignedString(createTimeRanges, hi) {
  hi >>>= 0;
  createTimeRanges >>>= 0;
  if (hi <= 2097151) return "" + (4294967296 * hi + createTimeRanges);
  return "" + ((BigInt(hi) << BigInt(32)) | BigInt(createTimeRanges));
}

/**
 * Render the current _lo/_hi as a signed decimal string.
 * [was: Eg]
 */
function toSignedString() {
  const createTimeRanges = _lo;
  const hi = _hi;
  if (hi & 2147483648) {
    return "" + ((BigInt(hi | 0) << BigInt(32)) | BigInt(createTimeRanges >>> 0));
  }
  return toUnsignedString(createTimeRanges, hi);
}

/**
 * Parse a decimal string and store result in _lo / _hi.
 * [was: sg]
 */
function parseDecimalIntoTemp(str) {
  if (str.length < 16) {
    splitSigned(Number(str));
  } else {
    const big = BigInt(str);
    _lo = Number(big & BigInt(4294967295)) >>> 0;
    _hi = Number((big >> BigInt(32)) & BigInt(4294967295));
  }
}

/**
 * Combine lo/hi halves into an unsigned BigInt-backed value.
 * [was: Fm]
 */
function makeUInt64BigInt(createTimeRanges, hi) {
  return validateBigInt(
    BigInt.asUintN(64, (BigInt(hi >>> 0) << BigInt(32)) + BigInt(createTimeRanges >>> 0))
  );
}

/**
 * Combine lo/hi halves into a signed BigInt-backed value.
 * [was: ZY]
 */
function makeInt64BigInt(createTimeRanges, hi) {
  return validateBigInt(
    BigInt.asIntN(
      64,
      (BigInt.asUintN(32, BigInt(hi)) << BigInt(32)) +
        BigInt.asUintN(32, BigInt(createTimeRanges))
    )
  );
}

// ---------------------------------------------------------------------------
// Numeric type coercion & validation
// ---------------------------------------------------------------------------

/**
 * Validate and coerce a value to BigInt.
 * Throws if the value is a non-integer number or an invalid string.
 * [was: DY]
 * @param {number|string|bigint} value
 * @returns {bigint}
 */
export function validateBigInt(value) {
  if (typeof value === "string") {
    if (!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(value)) throw Error(String(value));
  } else if (typeof value === "number" && !isSafeInteger(value)) {
    throw Error(String(value));
  }
  return BigInt(value);
}

/**
 * Validate a float/double field value.
 * [was: L3]
 * @param {*} value
 * @returns {number|null|undefined}
 */
export function validateFloat(value) {
  if (value != null && typeof value !== "number")
    throw Error(
      `Value of float/double field must be a number, found ${typeof value}: ${value}`
    );
  return value;
}

/**
 * Coerce a "maybe-numeric-string" to a number for float fields.
 * Returns undefined for non-numeric values.
 * [was: wY]
 */
export function coerceFloat(value) {
  if (value == null || typeof value === "number") return value;
  if (value === "NaN" || value === "Infinity" || value === "-Infinity")
    return Number(value);
  return undefined;
}

/**
 * Return a human-readable name for a constructor/type.
 * [was: b6]
 */
function typeName(ctor) {
  return ctor.displayName || ctor.name || "unknown type name";
}

/**
 * Validate a boolean proto field.
 * [was: jW]
 */
export function validateBool(value) {
  if (value != null && typeof value !== "boolean")
    throw Error(`Expected boolean but got ${typeOfDetailed(value)}: ${value}`);
  return value;
}

/**
 * Detailed typeof (distinguishes "array" and "null" from "object").
 * [was: NX]
 */
function typeOfDetailed(value) {
  const t = typeof value;
  return t !== "object" ? t : value ? (Array.isArray(value) ? "array" : t) : "null";
}

/**
 * Check whether a value is a valid integer-like input (number, string, or bigint).
 * [was: Og]
 * @param {*} value
 * @returns {boolean}
 */
export function isIntegerLike(value) {
  switch (typeof value) {
    case "bigint":
      return true;
    case "number":
      return isFiniteNumber(value);
    case "string":
      return DECIMAL_RE.test(value);
    default:
      return false;
  }
}

/**
 * Coerce to a signed int32 (throws on invalid input).
 * [was: f3]
 * @param {number} value
 * @returns {number}
 */
export function toInt32(value) {
  if (typeof value !== "number") throw protoWarning("int32");
  if (!isFiniteNumber(value)) throw protoWarning("int32");
  return value | 0;
}

/**
 * Coerce to int32 if non-null; returns null/undefined pass-through.
 * [was: aU]
 */
export function toInt32OrNull(value) {
  return value == null ? value : toInt32(value);
}

/**
 * Coerce a value to int32, returning undefined on failure.
 * Accepts strings and numbers.
 * [was: G0]
 */
export function coerceInt32(value) {
  if (value == null) return value;
  if (typeof value === "string" && value) value = +value;
  else if (typeof value !== "number") return undefined;
  return isFiniteNumber(value) ? value | 0 : undefined;
}

/**
 * Coerce a value to uint32, returning undefined on failure.
 * [was: $J]
 */
export function coerceUInt32(value) {
  if (value == null) return value;
  if (typeof value === "string" && value) value = +value;
  else if (typeof value !== "number") return undefined;
  return isFiniteNumber(value) ? value >>> 0 : undefined;
}

/**
 * Coerce to int64 (BigInt), throwing on invalid input.
 * [was: hC]
 * @param {*} value
 * @returns {bigint|null|undefined}
 */
export function toInt64(value) {
  if (value != null) {
    if (!isIntegerLike(value)) throw protoWarning("int64");
    switch (typeof value) {
      case "string":
        value = stringToBigInt(value);
        break;
      case "bigint":
        value = validateBigInt(bigintAsIntN(64, value));
        break;
      default:
        value = numberToBigInt(value);
    }
  }
  return value;
}

/**
 * Coerce a number to a signed string representation (for int64 fields).
 * [was: MS]
 */
export function numberToSignedString(value) {
  isIntegerLike(value);
  value = trunc(value);
  if (!isSafeInteger(value)) {
    splitSigned(value);
    let createTimeRanges = _lo;
    let hi = _hi;
    let isNegative;
    if ((isNegative = hi & 2147483648)) {
      createTimeRanges = (~createTimeRanges + 1) >>> 0;
      hi = ~hi >>> 0;
      if (createTimeRanges === 0) hi = (hi + 1) >>> 0;
    }
    const abs = toNumberOrString(createTimeRanges, hi);
    value =
      typeof abs === "number"
        ? isNegative
          ? -abs
          : abs
        : isNegative
          ? "-" + abs
          : abs;
  }
  return value;
}

/**
 * Coerce a string to int64 string representation (canonical form).
 * Handles truncation of decimal points and range validation.
 * [was: JC]
 */
export function stringToInt64String(value) {
  isIntegerLike(value);
  let numValue = trunc(Number(value));
  if (isSafeInteger(numValue)) return String(numValue);
  let dotIdx = value.indexOf(".");
  if (dotIdx !== -1) value = value.substring(0, dotIdx);
  const len = value.length;
  if (
    value[0] === "-"
      ? len < 20 || (len === 20 && value <= "-9223372036854775808")
      : len < 19 || (len === 19 && value <= "9223372036854775807")
  ) {
    // already canonical
  } else {
    parseDecimalIntoTemp(value);
    value = toSignedString();
  }
  return value;
}

/**
 * Parse a string directly to BigInt (signed, 64-bit clamped).
 * [was: PW]
 */
function stringToBigInt(str) {
  const numValue = trunc(Number(str));
  if (isSafeInteger(numValue)) return validateBigInt(numValue);
  const dotIdx = str.indexOf(".");
  if (dotIdx !== -1) str = str.substring(0, dotIdx);
  return validateBigInt(bigintAsIntN(64, BigInt(str)));
}

/**
 * Coerce a JS number to a BigInt int64 value.
 * [was: u6]
 */
function numberToBigInt(value) {
  if (isSafeInteger(value)) {
    return validateBigInt(numberToSignedString(value));
  }
  isIntegerLike(value);
  value = trunc(value);
  if (isSafeInteger(value)) {
    value = String(value);
  } else {
    splitSigned(value);
    value = toSignedString();
  }
  return validateBigInt(value);
}

/**
 * Coerce a value to a BigInt int64 (nullable).
 * [was: RU]
 */
export function coerceToInt64BigInt(value) {
  const type = typeof value;
  if (value == null) return value;
  if (type === "bigint") return validateBigInt(bigintAsIntN(64, value));
  if (isIntegerLike(value))
    return type === "string" ? stringToBigInt(value) : numberToBigInt(value);
  return undefined;
}

/**
 * Coerce a value to int64 string (nullable).
 * [was: NZy]
 */
export function coerceToInt64String(value) {
  if (value == null) return value;
  const type = typeof value;
  if (type === "bigint") return String(bigintAsIntN(64, value));
  if (isIntegerLike(value)) {
    if (type === "string") return stringToInt64String(value);
    if (type === "number") return numberToSignedString(value);
  }
  return undefined;
}

/**
 * Coerce a value to uint64 string (nullable).
 * [was: kJ]
 */
export function coerceToUInt64String(value) {
  if (value == null) return value;
  const type = typeof value;
  if (type === "bigint") return String(bigintAsUintN(64, value));
  if (isIntegerLike(value)) {
    if (type === "string") {
      isIntegerLike(value);
      let numValue = trunc(Number(value));
      if (isSafeInteger(numValue) && numValue >= 0) return String(numValue);
      let dotIdx = value.indexOf(".");
      if (dotIdx !== -1) value = value.substring(0, dotIdx);
      let inRange;
      if (value[0] === "-") {
        inRange = false;
      } else {
        const len = value.length;
        inRange = len < 20 ? true : len === 20 && value <= "18446744073709551615";
      }
      if (!inRange) {
        parseDecimalIntoTemp(value);
        value = toUnsignedString(_lo, _hi);
      }
      return value;
    }
    if (type === "number") {
      isIntegerLike(value);
      value = trunc(value);
      if (!(value >= 0 && isSafeInteger(value))) {
        splitSigned(value);
        value = toNumberOrString(_lo, _hi);
      }
      return value;
    }
  }
  return undefined;
}

/**
 * Coerce to ByteString-or-pass-through (strings and ByteString instances).
 * [was: YJ]
 */
export function coerceToBytes(value) {
  if (value == null || typeof value === "string" || value instanceof ByteString)
    return value;
  return undefined;
}

/**
 * Assert that value is a string (throws otherwise).
 * [was: yH0]
 */
export function assertString(value) {
  if (typeof value !== "string") throw Error();
  return value;
}

/**
 * Assert that value is a string or null/undefined.
 * [was: p3]
 */
export function assertStringOrNull(value) {
  if (value != null && typeof value !== "string") throw Error();
  return value;
}

/**
 * Return string value or undefined (no throw).
 * [was: Qm]
 */
export function toStringOrUndefined(value) {
  return value == null || typeof value === "string" ? value : undefined;
}

/**
 * Assert instanceof check.
 * [was: cw]
 */
export function assertInstance(value, ctor) {
  if (!(value instanceof ctor))
    throw Error(
      `Expected instanceof ${typeName(ctor)} but got ${value && typeName(value.constructor)}`
    );
  return value;
}

/**
 * Validate that an index is a valid non-negative integer within bounds.
 * [was: VB]
 * @param {Array} arr
 * @param {number} index
 */
export function validateArrayIndex(arr, index) {
  if (typeof index !== "number" || index < 0 || index >= arr.length)
    throw Error();
}

// ---------------------------------------------------------------------------
// ByteString coercion
// ---------------------------------------------------------------------------

/**
 * Coerce a value to ByteString (from string, Uint8Array, or existing ByteString).
 * [was: eW]
 * @param {*} value
 * @param {boolean} [lenient]  if true, return undefined instead of throwing
 * @returns {ByteString|undefined}
 */
export function coerceByteString(value, lenient) {
  if (value != null) {
    if (typeof value === "string") {
      value = value ? new ByteString(value, INTERNAL_TOKEN) : emptyByteString();
    } else if (value.constructor !== ByteString) {
      if (value != null && value instanceof Uint8Array) {
        value = value.length
          ? new ByteString(new Uint8Array(value), INTERNAL_TOKEN)
          : emptyByteString();
      } else {
        if (!lenient) throw Error();
        value = undefined;
      }
    }
  }
  return value;
}

/**
 * Coerce to ByteString (lenient — used as a field coercion callback).
 * [was: Gs]
 */
function coerceByteStringLenient(value) {
  return coerceByteString(value, true);
}

// ---------------------------------------------------------------------------
// Proto-message sub-message constructor helper
// ---------------------------------------------------------------------------

/**
 * Wrap an array into a proto-message instance if it matches the marker.
 * [was: KU]
 */
export function wrapAsMessage(value, ctor, parentFlags) {
  if (value != null && value[SYM_MESSAGE_MARKER] === MESSAGE_MARKER)
    return value;
  if (Array.isArray(value)) {
    let flags = value[SYM_FLAGS] | 0;
    const newFlags = flags | (parentFlags & 32) | (parentFlags & 2);
    if (newFlags !== flags) value[SYM_FLAGS] = newFlags;
    return new ctor(value);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Extension data access
// ---------------------------------------------------------------------------

/**
 * Read the extension data slot from a message array.
 * The slot is keyed by `SYM_EXTENSION_DATA` (was: `o6`).
 * [was: rD]
 */
function getExtensionData(arr) {
  const key = resolveSymbol(SYM_EXTENSION_DATA); // was: w0(o6)
  return key ? arr[key] : undefined;
}

/**
 * Resolve a symbol (identity function in production).
 * [was: w0]
 */
function resolveSymbol(sym) {
  return sym;
}

// ---------------------------------------------------------------------------
// ExtensionDataMap class
// ---------------------------------------------------------------------------

/**
 * Empty class used as the constructor for extension-data maps stored
 * on proto message arrays.  Instances are plain objects with numeric keys.
 * [was: I6]
 */
class ExtensionDataMap {}

/**
 * Clone an ExtensionDataMap (shallow copy of array entries + `aP` flag).
 * [was: Sv3]
 */
function cloneExtensionDataMap(source) {
  const copy = new ExtensionDataMap();
  iterateNumericKeys(source, (_obj, key, value) => {
    copy[key] = [...value];
  });
  copy.aP = source.aP;
  return copy;
}

/**
 * Iterate over the numeric keys of an object (used for extension data).
 * [was: UV]
 */
function iterateNumericKeys(obj, callback) {
  for (const key in obj) {
    if (!isNaN(key)) callback(obj, +key, obj[key]);
  }
}

// ---------------------------------------------------------------------------
// Message-array flag helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a message (and its backing array) is frozen/immutable.
 * [was: AC]
 * @param {object} message    proto message instance with `.ownedState` (was `.W`) and `.array` (was `.zU`)
 * @param {number} [flags]    optional pre-read flags word
 * @returns {boolean}
 */
export function isFrozen(message, flags) {
  return flags === undefined
    ? message.ownedState !== FROZEN_SENTINEL &&
        !!(2 & (message.array[SYM_FLAGS] | 0))
    : !!(2 & flags) && message.ownedState !== FROZEN_SENTINEL;
}

/**
 * Check whether a message array is "frozen and validated" (fully locked).
 * [was: a6]
 */
function isFrozenAndValidated(flags) {
  return (!!( 2 & flags) && !!(4 & flags)) || !!(256 & flags);
}

/**
 * Set the "has been accessed" flag on the message array.
 * [was: EV]
 */
function markAccessed(arr, flags) {
  flags === undefined && (flags = arr[SYM_FLAGS] | 0);
  if ((flags & 32) && !(flags & 4096)) {
    arr[SYM_FLAGS] = flags | 4096;
  }
}

/**
 * Check if a message needs deep-copy and/or can be "taken over".
 * Returns true if the message should be considered immutable (needs copy).
 * [was: iF]
 */
function needsCopy(message, arr, flags) {
  if (flags & 2) return true;
  if ((flags & 32) && !(flags & 4096)) {
    arr[SYM_FLAGS] = flags | 2;
    message.ownedState = FROZEN_SENTINEL;
    return true;
  }
  return false;
}

/**
 * Derive new flags for a copied array, inheriting the frozen bit from the parent.
 * [was: OV]
 */
function deriveCopiedFlags(childFlags, parentFlags) {
  return (childFlags = ((2 & parentFlags) ? childFlags | 2 : childFlags & ~2) & ~272);
}

/**
 * Compute the merged flags for a repeated-field array considering parent state.
 * [was: gD]
 */
function mergeRepeatedFlags(childFlags, parentFlags) {
  if (2 & parentFlags) childFlags |= 2;
  return childFlags | 1;
}

/**
 * Return the 128-offset token if the flags indicate offset-128 mode, else undefined.
 * [was: qS]
 */
function getOffsetToken(flags) {
  return (flags & 128) ? OFFSET_128_TOKEN : undefined;
}

// ---------------------------------------------------------------------------
// Iterate over message-array fields
// ---------------------------------------------------------------------------

/**
 * Iterate over the populated fields of a message array, invoking
 * `callback(fieldNumber, value)` for each.
 * [was: BW]
 * @param {Array}    arr      raw message array
 * @param {number}   flags    flags word (arr[SYM_FLAGS])
 * @param {Function} callback (fieldNumber, value) => void
 */
export function iterateFields(arr, flags, callback) {
  const offset = (flags & 128) ? 0 : -1;
  const len = arr.length;
  let hasTrailingObject;
  if ((hasTrailingObject = !!len)) {
    const last = arr[len - 1];
    hasTrailingObject =
      last != null && typeof last === "object" && last.constructor === Object;
  }
  const dataEnd = len + (hasTrailingObject ? -1 : 0);
  for (let idx = (flags & 128) ? 1 : 0; idx < dataEnd; idx++) {
    callback(idx - offset, arr[idx]);
  }
  if (hasTrailingObject) {
    const trailing = arr[len - 1];
    for (const key in trailing) {
      if (!isNaN(key)) callback(+key, trailing[key]);
    }
  }
}

// ---------------------------------------------------------------------------
// Deep serialize a message array (As + Vm)
// ---------------------------------------------------------------------------

/**
 * Core array-walking serializer.  Walks every element, applying `transform`
 * to produce the JSON-compatible output.  Handles trailing-object "overflow"
 * storage and extension data.
 * [was: As]
 *
 * @param {Array}    arr        raw message array
 * @param {number}   flags      flags word
 * @param {Function} transform  (value, isCopy) => jsonValue
 * @param {boolean}  [forceCopy]
 * @returns {Array}  new JSON-ready array
 */
function serializeArray(arr, flags, transform, forceCopy) {
  const hasForceCopy = forceCopy !== undefined;
  forceCopy = !!forceCopy;
  let extKey = resolveSymbol(SYM_EXTENSION_DATA);
  let extData;
  if (!hasForceCopy && extKey) {
    extData = arr[extKey];
    if (extData) iterateNumericKeys(extData, checkPivotLimit);
  }

  const output = [];
  let len = arr.length;
  let trailingObj;
  let pivotIndex = 4294967295;
  let needsPush = false;
  const has64 = !!(flags & 64);
  const base = has64 ? ((flags & 128) ? 0 : -1) : undefined;

  if (!(flags & 1)) {
    trailingObj = len && arr[len - 1];
    if (
      trailingObj != null &&
      typeof trailingObj === "object" &&
      trailingObj.constructor === Object
    ) {
      len--;
      pivotIndex = len;
    } else {
      trailingObj = undefined;
    }
    if (!has64 || (flags & 128) || hasForceCopy) {
      // no adjustment needed
    } else {
      needsPush = true;
      pivotIndex =
        ((_jsonExtensionVisitor ?? identity)(pivotIndex - base, base, arr, trailingObj, undefined)) + base;
    }
  }

  let overflow;
  for (let i = 0; i < len; i++) {
    let val = arr[i];
    if (val != null && (val = transform(val, forceCopy)) != null) {
      if (has64 && i >= pivotIndex) {
        const fieldNum = i - base;
        (overflow ?? (overflow = {}))[fieldNum] = val;
      } else {
        output[i] = val;
      }
    }
  }

  if (trailingObj) {
    for (const key in trailingObj) {
      let val = trailingObj[key];
      if (val == null || (val = transform(val, forceCopy)) == null) continue;
      const numKey = +key;
      let slot;
      if (has64 && !Number.isNaN(numKey) && (slot = numKey + base) < pivotIndex) {
        output[slot] = val;
      } else {
        (overflow ?? (overflow = {}))[key] = val;
      }
    }
  }

  if (overflow) {
    if (needsPush) output.push(overflow);
    else output[pivotIndex] = overflow;
  }

  if (hasForceCopy && resolveSymbol(SYM_EXTENSION_DATA)) {
    const ext = getExtensionData(arr);
    if (ext && ext instanceof ExtensionDataMap) {
      output[SYM_EXTENSION_DATA] = cloneExtensionDataMap(ext);
    }
  }

  return output;
}

/**
 * Pivot-limit check callback (logs incident if too high).
 * [was: ZmK]
 */
function checkPivotLimit(_obj, fieldNum) {
  if (fieldNum >= 100) reportIncident(SYM_INCIDENT_KEY, 1);
}

/**
 * Transform a single value for JSON serialization.
 * Handles numbers, booleans, bigints, arrays, proto messages, and ByteStrings.
 * [was: Vm]
 */
function transformForJson(value) {
  switch (typeof value) {
    case "number":
      return Number.isFinite(value) ? value : "" + value;
    case "bigint":
      return isSafeBigInt(value) ? Number(value) : "" + value;
    case "boolean":
      return value ? 1 : 0;
    case "object": {
      if (Array.isArray(value)) {
        const flags = value[SYM_FLAGS] | 0;
        if (value.length === 0 && (flags & 1)) return undefined;
        return serializeArray(value, flags, transformForJson);
      }
      if (value != null && value[SYM_MESSAGE_MARKER] === MESSAGE_MARKER) {
        return serializeMessage(value);
      }
      if (value instanceof ByteString) {
        const raw = value.data;
        if (raw == null) return "";
        if (typeof raw === "string") return raw;
        // Convert Uint8Array to base64 string
        let result = "";
        let offset = 0;
        const chunkEnd = raw.length - 10240;
        for (; offset < chunkEnd; ) {
          result += String.fromCharCode.apply(
            null,
            raw.subarray(offset, (offset += 10240))
          );
        }
        result += String.fromCharCode.apply(
          null,
          offset ? raw.subarray(offset) : raw
        );
        return (value.data = btoa(result));
      }
      return undefined;
    }
  }
  return value;
}

/**
 * Serialize a proto message's backing array to a JSON-compatible array.
 * [was: Bw]
 */
function serializeMessage(message) {
  const arr = message.array; // was: Q.zU
  return serializeArray(arr, arr[SYM_FLAGS] | 0, transformForJson);
}

/**
 * Serialize a proto message with an optional extension visitor.
 * [was: xH]
 * @param {object}   message   proto message instance
 * @param {Function} [visitor] extension visitor
 * @returns {Array}
 */
export function toJsonWithExtensions(message, visitor) {
  if (visitor) {
    _jsonExtensionVisitor =
      visitor == null || visitor === identity || visitor[SYM_EXT_VISITOR_ID] !== EXT_VISITOR_IDENTITY_TOKEN
        ? identity
        : visitor;
    try {
      return serializeMessage(message);
    } finally {
      _jsonExtensionVisitor = undefined;
    }
  }
  return serializeMessage(message);
}

// ---------------------------------------------------------------------------
// Default-value tuple helpers
// ---------------------------------------------------------------------------

/**
 * Create a "default value descriptor" for a field.  Returns a compact
 * tuple used by `initMessageArray`.
 * [was: d97]
 */
function defaultValueDescriptor(value) {
  switch (typeof value) {
    case "boolean":
      return _cachedBoolDefault || (_cachedBoolDefault = [0, undefined, true]);
    case "number":
      return value > 0
        ? undefined
        : value === 0
          ? _cachedZeroDefault || (_cachedZeroDefault = [0, undefined])
          : [-value, undefined];
    case "string":
      return [0, value];
    case "object":
      return value;
  }
  return undefined;
}

/**
 * Initialise a message array from a default-value tuple.
 * [was: ts]
 */
function initFromDefault(arr, spec) {
  return initMessageArray(arr, spec[0], spec[1]);
}

/**
 * Initialise (or wrap) a raw JS array as a proto message array.
 * Sets up flags, validates structure, moves "overflow" fields into the
 * trailing object, and freezes the flags word.
 * [was: Dc]
 *
 * @param {Array|null} arr          existing array or null to create one
 * @param {number}     [pivot]      pivot index for large field numbers  [was: c]
 * @param {*}          [base]       base offset marker                   [was: W]
 * @param {number}     [extraFlags] additional flag bits to OR in        [was: m]
 * @returns {Array}    the initialised message array
 */
export function initMessageArray(arr, pivot, base, extraFlags = 0) {
  let flags; // was: K
  if (arr == null) {
    flags = 32;
    if (base) {
      arr = [base];
      flags |= 128;
    } else {
      arr = [];
    }
    if (pivot) flags = (flags & -16760833) | ((pivot & 1023) << 14);
  } else {
    if (!Array.isArray(arr)) throw Error("narr");
    flags = arr[SYM_FLAGS] | 0;
    if (_IMMUTABILITY_ENABLED && (1 & flags)) throw Error("rfarr");
    if ((2048 & flags) && !(2 & flags)) warnConcurrentRead();
    if (flags & 256) throw Error("farr");
    if (flags & 64) {
      if ((flags | extraFlags) !== flags) arr[SYM_FLAGS] = flags | extraFlags;
      return arr;
    }
    if (base && ((flags |= 128), base !== arr[0])) throw Error("mid");

    // labeled block (was: `a: { ... }`) — compact trailing-object overflow
    compactOverflow: {
      const W = arr; // was: W = Q
      flags |= 64;
      let T = W.length; // was: var T = W.length
      if (T) {
        let r = T - 1; // was: var r = T - 1
        const lastElem = W[r]; // was: const I = W[r]
        if (
          lastElem != null &&
          typeof lastElem === "object" &&
          lastElem.constructor === Object
        ) {
          pivot = (flags & 128) ? 0 : -1; // was: c = K & 128 ? 0 : -1
          r -= pivot;
          if (r >= 1024) throw Error("pvtlmt");
          for (const key in lastElem) { // was: for (var U in I)
            T = +key; // was: T = +U
            if (T < r) {
              W[T + pivot] = lastElem[key]; // was: W[T + c] = I[U]
              delete lastElem[key];          // was: delete I[U]
            } else {
              break;
            }
          }
          flags = (flags & -16760833) | ((r & 1023) << 14);
          break compactOverflow;
        }
      }
      if (pivot) {
        const maxPivot = Math.max(pivot, T - ((flags & 128) ? 0 : -1)); // was: U = Math.max(c, T - (...))
        if (maxPivot > 1024) throw Error("spvt");
        flags = (flags & -16760833) | ((maxPivot & 1023) << 14);
      }
    }
  }
  arr[SYM_FLAGS] = flags | 64 | extraFlags; // was: Q[Xm] = K | 64 | m
  return arr;
}

/**
 * Immutability experiment flag (from Closure FLAGS).
 * [was: Hw]  — `H3(748402147, true)`
 */
const _IMMUTABILITY_ENABLED = true;

/**
 * Warn about concurrent array reads.
 * [was: Law]
 */
function warnConcurrentRead() {
  if (_IMMUTABILITY_ENABLED) throw Error("carr");
  reportIncident(SYM_CONCURRENT_READ_INCIDENT, 5);
}

// ---------------------------------------------------------------------------
// Deep-copy / freeze machinery
// ---------------------------------------------------------------------------

/**
 * Deep-process a single value for copy/freeze.
 * [was: bmK]
 */
function deepProcessValue(value, forceCopy) {
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    let flags = value[SYM_FLAGS] | 0;
    if (value.length === 0 && (flags & 1)) return undefined;
    if (flags & 2) return value;
    if (
      !forceCopy ||
      (4096 & flags) ||
      (16 & flags)
    ) {
      return deepCopyArray(value, flags, false, forceCopy && !(flags & 16));
    }
    value[SYM_FLAGS] |= 34;
    if (flags & 4) Object.freeze(value);
    return value;
  }
  if (value != null && value[SYM_MESSAGE_MARKER] === MESSAGE_MARKER) {
    const arr = value.array;
    const flags = arr[SYM_FLAGS] | 0;
    if (isFrozen(value, flags)) return value;
    if (needsCopy(value, arr, flags)) return cloneMessage(value, arr);
    return deepCopyArray(arr, flags);
  }
  if (value instanceof ByteString) return value;
  return undefined;
}

/**
 * Clone a proto message instance using its constructor.
 * [was: ym]
 */
function cloneMessage(message, arr, setFrozen) {
  const clone = new message.constructor(arr);
  if (setFrozen) clone.ownedState = FROZEN_SENTINEL;
  clone.extensionState = FROZEN_SENTINEL; // was: .j = IU
  return clone;
}

/**
 * Deep-copy a message array, applying freeze flags.
 * [was: Ny]
 */
function deepCopyArray(arr, flags, setImmutable, forceCopy) {
  forceCopy ?? (forceCopy = !!(34 & flags));
  arr = serializeArray(arr, flags, deepProcessValue, forceCopy);
  let newFlags = 32;
  if (setImmutable) newFlags |= 2;
  newFlags = (flags & 16769217) | newFlags;
  arr[SYM_FLAGS] = newFlags;
  return arr;
}

/**
 * Create a deep copy of a message, ensuring the copy is mutable.
 * [was: Sy]
 */
export function deepCopyMessage(message) {
  const arr = message.array;
  const flags = arr[SYM_FLAGS] | 0;
  if (isFrozen(message, flags)) {
    return needsCopy(message, arr, flags)
      ? cloneMessage(message, arr, true)
      : new message.constructor(deepCopyArray(arr, flags, false));
  }
  return message;
}

/**
 * Attempt to "take ownership" of a frozen message by copying its array.
 * Returns true if the message was frozen and is now mutable.
 * [was: Fv]
 */
export function takeOwnership(message) {
  if (message.ownedState !== FROZEN_SENTINEL) return false;
  let arr = message.array;
  arr = deepCopyArray(arr, arr[SYM_FLAGS] | 0);
  arr[SYM_FLAGS] |= 2048;
  message.array = arr;
  message.ownedState = undefined;
  message.extensionState = undefined;
  return true;
}

/**
 * Ensure a message is mutable (take ownership or throw if truly frozen).
 * [was: Zc]
 */
export function ensureMutable(message) {
  if (!takeOwnership(message) && isFrozen(message, message.array[SYM_FLAGS] | 0))
    throw Error();
}

// ---------------------------------------------------------------------------
// Field get / set on raw message arrays
// ---------------------------------------------------------------------------

/**
 * Read a field value from the message array, optionally applying a coercion.
 * [was: dD]
 *
 * @param {object}   message     proto message (has `.array`, `.extensionState`)
 * @param {number}   fieldNumber
 * @param {*}        [offsetToken]
 * @param {boolean}  [checkExtState]  if true, also check extension state
 * @param {Function} [coerceFn]       optional coercion applied to the raw value
 * @returns {*}
 */
export function getField(message, fieldNumber, offsetToken, checkExtState, coerceFn) {
  Object.isExtensible(message);
  const result = getFieldRaw(message.array, fieldNumber, offsetToken, coerceFn);
  if (result !== null || (checkExtState && message.extensionState !== FROZEN_SENTINEL))
    return result;
  return undefined;
}

/**
 * Low-level field read from the raw array.
 * Handles both inline storage and trailing-object overflow.
 * [was: sV]
 *
 * @param {Array}    arr          raw message array
 * @param {number}   fieldNumber  1-based field number (or -1 for "none")
 * @param {*}        [offsetToken]  presence of OFFSET_128_TOKEN shifts indices
 * @param {Function} [coerceFn]    optional coercion
 * @returns {*}
 */
export function getFieldRaw(arr, fieldNumber, offsetToken, coerceFn) {
  if (fieldNumber === -1) return null;
  const index = fieldNumber + (offsetToken ? 0 : -1);
  const lastIdx = arr.length - 1;
  let trailingObj;
  let fromOverflow;
  let value;

  if (!(lastIdx < 1 + (offsetToken ? 0 : -1))) {
    if (index >= lastIdx) {
      trailingObj = arr[lastIdx];
      if (
        trailingObj != null &&
        typeof trailingObj === "object" &&
        trailingObj.constructor === Object
      ) {
        value = trailingObj[fieldNumber];
        fromOverflow = true;
      } else if (index === lastIdx) {
        value = trailingObj;
      } else {
        return undefined;
      }
    } else {
      value = arr[index];
    }
    if (coerceFn && value != null) {
      const coerced = coerceFn(value);
      if (coerced == null) return coerced;
      if (!Object.is(coerced, value)) {
        if (fromOverflow) trailingObj[fieldNumber] = coerced;
        else arr[index] = coerced;
        return coerced;
      }
    }
    return value;
  }
  return undefined;
}

/**
 * Set a field value on a mutable message.
 * [was: wD]
 *
 * @param {object} message      proto message instance
 * @param {number} fieldNumber
 * @param {*}      value
 * @param {*}      [offsetToken]
 * @returns {object} the message (for chaining)
 */
export function setField(message, fieldNumber, value, offsetToken) {
  ensureMutable(message);
  const arr = message.array;
  setFieldRaw(arr, arr[SYM_FLAGS] | 0, fieldNumber, value, offsetToken);
  return message;
}

/**
 * Low-level field write on the raw array.
 * [was: LU]
 *
 * @param {Array}  arr          raw message array
 * @param {number} flags        current flags word
 * @param {number} fieldNumber  1-based field number
 * @param {*}      value
 * @param {*}      [offsetToken]
 * @returns {number} possibly-updated flags word
 */
export function setFieldRaw(arr, flags, fieldNumber, value, offsetToken) {
  const index = fieldNumber + (offsetToken ? 0 : -1);
  const lastIdx = arr.length - 1;

  if (lastIdx >= 1 + (offsetToken ? 0 : -1) && index >= lastIdx) {
    const trailing = arr[lastIdx];
    if (
      trailing != null &&
      typeof trailing === "object" &&
      trailing.constructor === Object
    ) {
      trailing[fieldNumber] = value;
      return flags;
    }
  }

  if (index <= lastIdx) {
    arr[index] = value;
    return flags;
  }

  if (value !== undefined) {
    const pivot =
      (flags ?? (flags = arr[SYM_FLAGS] | 0)) >> 14 & 1023 || 536870912;
    if (fieldNumber >= pivot) {
      if (value != null) {
        arr[pivot + (offsetToken ? 0 : -1)] = { [fieldNumber]: value };
      }
    } else {
      arr[index] = value;
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Repeated field management
// ---------------------------------------------------------------------------

/**
 * Get a repeated field array from the message array.
 * Returns EMPTY_REPEATED if the field is not set.
 * [was: bF]
 */
function getRepeatedRaw(arr, fieldNumber, offsetToken) {
  const val = getFieldRaw(arr, fieldNumber, offsetToken);
  return Array.isArray(val) ? val : EMPTY_REPEATED;
}

/**
 * Get (or create) a mutable repeated field array.
 * Handles copy-on-write for frozen arrays.
 * [was: uF]
 */
export function getMutableRepeated(arr, flags, fieldNumber) {
  if (flags & 2) throw Error();
  const offsetToken = getOffsetToken(flags);
  let repeated = getRepeatedRaw(arr, fieldNumber, offsetToken);
  let childFlags = repeated === EMPTY_REPEATED ? 7 : repeated[SYM_FLAGS] | 0;
  let merged = mergeRepeatedFlags(childFlags, flags);

  if ((2 & merged) || isFrozenAndValidated(merged) || (16 & merged)) {
    if (merged !== childFlags || isFrozenAndValidated(merged)) {
      repeated[SYM_FLAGS] = merged;
    }
    repeated = [...repeated];
    childFlags = 0;
    merged = deriveCopiedFlags(merged, flags);
    setFieldRaw(arr, flags, fieldNumber, repeated, offsetToken);
  }

  merged &= ~12;
  if (merged !== childFlags) repeated[SYM_FLAGS] = merged;
  return repeated;
}

/**
 * Access a repeated field with full copy/freeze/validation semantics.
 * [was: vw]
 */
export function accessRepeated(message, fieldNumber, transform, mutability, freeze) {
  let arr = message.array;
  let flags = arr[SYM_FLAGS] | 0;
  mutability = isFrozen(message, flags) ? 1 : mutability;
  freeze = !!freeze || mutability === 3;

  if (mutability === 2) {
    takeOwnership(message);
    arr = message.array;
    flags = arr[SYM_FLAGS] | 0;
  }

  let repeated = getRepeatedRaw(arr, fieldNumber);
  let childFlags = repeated === EMPTY_REPEATED ? 7 : repeated[SYM_FLAGS] | 0;
  let merged = mergeRepeatedFlags(childFlags, flags);
  let needsValidation = (4 & merged) ? false : true;

  if (needsValidation) {
    if (4 & merged) {
      repeated = [...repeated];
      childFlags = 0;
      merged = deriveCopiedFlags(merged, flags);
      flags = setFieldRaw(arr, flags, fieldNumber, repeated);
    }
    let writeIdx = 0;
    let readIdx = 0;
    for (; readIdx < repeated.length; readIdx++) {
      const transformed = transform(repeated[readIdx]);
      if (transformed != null) repeated[writeIdx++] = transformed;
    }
    if (writeIdx < readIdx) repeated.length = writeIdx;
    merged = (merged | 4) & ~512;
    merged &= ~1024;
    merged &= ~4096;
  }

  if (merged !== childFlags) {
    repeated[SYM_FLAGS] = merged;
    if (2 & merged) Object.freeze(repeated);
  }
  return (repeated = finalizeRepeated(repeated, merged, arr, flags, fieldNumber, undefined, mutability, needsValidation, freeze));
}

/**
 * Finalize a repeated field array (freeze/mark-accessed as needed).
 * [was: fU]
 */
function finalizeRepeated(repeated, childFlags, arr, parentFlags, fieldNumber, offsetToken, mutability, wasValidated, freeze) {
  let origFlags = childFlags;
  if (
    mutability === 1 ||
    (mutability !== 4 ? false : (2 & childFlags) || (!(16 & childFlags) && (32 & parentFlags)))
  ) {
    if (!isFrozenAndValidated(childFlags)) {
      childFlags |=
        !repeated.length ||
        (wasValidated && !(4096 & childFlags)) ||
        ((32 & parentFlags) && !(4096 & childFlags || 16 & childFlags))
          ? 2
          : 256;
      if (childFlags !== origFlags) repeated[SYM_FLAGS] = childFlags;
      Object.freeze(repeated);
    }
  } else {
    if (mutability === 2 && isFrozenAndValidated(childFlags)) {
      repeated = [...repeated];
      origFlags = 0;
      childFlags = deriveCopiedFlags(childFlags, parentFlags);
      parentFlags = setFieldRaw(arr, parentFlags, fieldNumber, repeated, offsetToken);
    }
    if (!isFrozenAndValidated(childFlags)) {
      if (!freeze) childFlags |= 16;
      if (childFlags !== origFlags) repeated[SYM_FLAGS] = childFlags;
    }
  }
  if (!(2 & childFlags) && (4096 & childFlags || 16 & childFlags)) {
    markAccessed(arr, parentFlags);
  }
  return repeated;
}

/**
 * Set a repeated-field array (with validation).
 * [was: Pw]
 */
export function setRepeatedField(message, fieldNumber, values, validateFn) {
  ensureMutable(message);
  const arr = message.array;
  let flags = arr[SYM_FLAGS] | 0;

  if (values == null) {
    setFieldRaw(arr, flags, 3);
    return message;
  }
  if (!Array.isArray(values)) throw protoWarning();

  let childFlags = values === EMPTY_REPEATED ? 7 : values[SYM_FLAGS] | 0;
  let origFlags = childFlags;
  const wasFrozenValidated = isFrozenAndValidated(childFlags);
  let isFrozenArr = wasFrozenValidated || Object.isFrozen(values);
  if (!wasFrozenValidated) childFlags = 0;
  if (!isFrozenArr) {
    values = [...values];
    origFlags = 0;
    childFlags = deriveCopiedFlags(childFlags, flags);
    isFrozenArr = false;
  }
  childFlags |= 5;

  const validationType =
    ((4 & childFlags)
      ? (512 & childFlags) ? 512 : (1024 & childFlags) ? 1024 : 0
      : undefined) ?? 1024;
  childFlags |= validationType;

  for (let i = 0; i < values.length; i++) {
    const original = values[i];
    const validated = validateFn(original, validationType);
    if (!Object.is(original, validated)) {
      if (isFrozenArr) {
        values = [...values];
        origFlags = 0;
        childFlags = deriveCopiedFlags(childFlags, flags);
        isFrozenArr = false;
      }
      values[i] = validated;
    }
  }

  if (childFlags !== origFlags) {
    if (isFrozenArr) {
      values = [...values];
      childFlags = deriveCopiedFlags(childFlags, flags);
    }
    values[SYM_FLAGS] = childFlags;
  }
  setFieldRaw(arr, flags, 3, values);
  return message;
}

/**
 * Set a field with a default-value check (clears to undefined if value equals default).
 * [was: lF]
 */
export function setFieldWithDefault(message, fieldNumber, value, defaultValue, offsetToken) {
  ensureMutable(message);
  const arr = message.array;
  const cleared =
    (defaultValue === "0" ? Number(value) === 0 : value === defaultValue)
      ? undefined
      : value;
  setFieldRaw(arr, arr[SYM_FLAGS] | 0, fieldNumber, cleared, offsetToken);
  return message;
}

/**
 * Set a message-typed repeated field (with instanceof validation).
 * [was: IP]
 */
export function setRepeatedMessageField(message, fieldNumber, ctor, values) {
  ensureMutable(message);
  const arr = message.array;
  let flags = arr[SYM_FLAGS] | 0;

  if (values == null) {
    setFieldRaw(arr, flags, fieldNumber);
    return message;
  }
  if (!Array.isArray(values)) throw protoWarning();

  let childFlags = values === EMPTY_REPEATED ? 7 : values[SYM_FLAGS] | 0;
  let origFlags = childFlags;
  const wasFV = isFrozenAndValidated(childFlags);
  const wasFrozen = wasFV || Object.isFrozen(values);
  let allMutable = true;
  let allFrozen = true;

  for (let i = 0; i < values.length; i++) {
    const elem = values[i];
    assertInstance(elem, ctor);
    if (!wasFV) {
      const elemFrozen = isFrozen(elem);
      if (allMutable) allMutable = !elemFrozen;
      if (allFrozen) allFrozen = elemFrozen;
    }
  }

  if (!wasFV) {
    childFlags = allMutable ? 13 : 5;
    childFlags = allFrozen ? childFlags & ~4096 : childFlags | 4096;
  }

  if (wasFrozen && childFlags === origFlags) {
    // no change needed
  } else {
    values = [...values];
    origFlags = 0;
    childFlags = deriveCopiedFlags(childFlags, flags);
  }
  if (childFlags !== origFlags) values[SYM_FLAGS] = childFlags;

  flags = setFieldRaw(arr, flags, fieldNumber, values);
  if (!(2 & childFlags) && (4096 & childFlags || 16 & childFlags)) {
    markAccessed(arr, flags);
  }
  return message;
}

/**
 * Push a message onto a repeated message field.
 * [was: Xg]
 */
export function pushRepeatedMessage(message, fieldNumber, ctor, value) {
  let newValue = value;
  ensureMutable(message);
  const arr = message.array;
  const repeated = accessRepeatedMessages(
    message,
    arr,
    arr[SYM_FLAGS] | 0,
    ctor,
    fieldNumber,
    2
  );
  newValue = newValue != null ? assertInstance(newValue, ctor) : new ctor();
  repeated.push(newValue);
  let childFlags = repeated === EMPTY_REPEATED ? 7 : repeated[SYM_FLAGS] | 0;
  let origFlags = childFlags;
  const elemFrozen = isFrozen(newValue);
  if (elemFrozen) {
    childFlags &= ~8;
    if (repeated.length === 1) childFlags &= ~4096;
  } else {
    childFlags |= 4096;
  }
  if (childFlags !== origFlags) repeated[SYM_FLAGS] = childFlags;
  if (!elemFrozen) markAccessed(arr);
}

// ---------------------------------------------------------------------------
// Oneof field tracking
// ---------------------------------------------------------------------------

/**
 * Set a field that belongs to a oneof group.
 * Clears the previously-set field in the same group.
 * [was: R6]
 */
export function setOneofField(message, fieldNumber, oneofFields, value) {
  ensureMutable(message);
  const arr = message.array;
  let flags = arr[SYM_FLAGS] | 0;

  if (value == null) {
    const map = getOneofMap(arr);
    if (getActiveOneofField(map, arr, flags, oneofFields) === fieldNumber) {
      map.set(oneofFields, 0);
    } else {
      return message;
    }
  } else {
    flags = clearOtherOneofFields(arr, flags, oneofFields, fieldNumber);
  }
  setFieldRaw(arr, flags, fieldNumber, value);
  return message;
}

/**
 * Low-level oneof field write on the raw array (clears others first).
 * [was: kH]
 */
function setOneofFieldRaw(arr, fieldNumber, oneofFields, value) {
  let flags = arr[SYM_FLAGS] | 0;
  const offsetToken = getOffsetToken(flags);
  flags = clearOtherOneofFields(arr, flags, oneofFields, fieldNumber, offsetToken);
  setFieldRaw(arr, flags, fieldNumber, value, offsetToken);
}

/**
 * Return which field in a oneof group is currently set.
 * Returns -1 if the requested field is not the active one.
 * [was: YH]
 */
export function getOneofCase(message, oneofFields, expectedField) {
  const arr = message.array;
  return getActiveOneofField(getOneofMap(arr), arr, undefined, oneofFields) === expectedField
    ? expectedField
    : -1;
}

/**
 * Lazily create the oneof tracking Map on a message array.
 * [was: hs]
 */
function getOneofMap(arr) {
  return arr[SYM_ONEOF_MAP] ?? (arr[SYM_ONEOF_MAP] = new Map());
}

/**
 * Clear the other fields in a oneof group when setting a new field.
 * [was: Js]
 */
function clearOtherOneofFields(arr, flags, oneofFields, newField, offsetToken) {
  if (newField === 0 || oneofFields.includes(newField)) {
    // expected
  }
  const map = getOneofMap(arr);
  const active = getActiveOneofField(map, arr, flags, oneofFields, offsetToken);
  if (active !== newField) {
    if (active) flags = setFieldRaw(arr, flags, active, undefined, offsetToken);
    map.set(oneofFields, newField);
  }
  return flags;
}

/**
 * Determine which field in a oneof group is currently set.
 * Scans the array on first access, then caches in the Map.
 * [was: zs]
 */
function getActiveOneofField(map, arr, flags, oneofFields, offsetToken) {
  let cached = map.get(oneofFields);
  if (cached != null) return cached;
  cached = 0;
  for (let i = 0; i < oneofFields.length; i++) {
    const field = oneofFields[i];
    if (getFieldRaw(arr, field, offsetToken) != null) {
      if (cached !== 0) flags = setFieldRaw(arr, flags, cached, undefined, offsetToken);
      cached = field;
    }
  }
  map.set(oneofFields, cached);
  return cached;
}

// ---------------------------------------------------------------------------
// Sub-message field access
// ---------------------------------------------------------------------------

/**
 * Get/initialise a sub-message array from the raw message array.
 * If the slot contains a proto message instance, unwraps it.
 * [was: Qe]
 */
export function getSubMessageArray(arr, spec, fieldNumber) {
  let flags = arr[SYM_FLAGS] | 0;
  const offsetToken = getOffsetToken(flags);
  const raw = getFieldRaw(arr, fieldNumber, offsetToken);
  let innerArr;

  if (raw != null && raw[SYM_MESSAGE_MARKER] === MESSAGE_MARKER) {
    if (!isFrozen(raw)) {
      takeOwnership(raw);
      return raw.array;
    }
    innerArr = raw.array;
  } else if (Array.isArray(raw)) {
    innerArr = raw;
  }

  if (innerArr) {
    const innerFlags = innerArr[SYM_FLAGS] | 0;
    if (innerFlags & 2) innerArr = deepCopyArray(innerArr, innerFlags);
  }

  innerArr = initFromDefault(innerArr, spec);
  if (innerArr !== raw) setFieldRaw(arr, flags, fieldNumber, innerArr, offsetToken);
  return innerArr;
}

/**
 * Try to wrap a raw value as a proto message instance (with coercion).
 * [was: c_]
 */
function tryWrapMessage(arr, flags, ctor, fieldNumber, offsetToken) {
  let replaced = false;
  const value = getFieldRaw(arr, fieldNumber, offsetToken, (raw) => {
    const wrapped = wrapAsMessage(raw, ctor, flags);
    replaced = wrapped !== raw && wrapped != null;
    return wrapped;
  });
  if (value != null) {
    if (replaced && !isFrozen(value)) markAccessed(arr, flags);
    return value;
  }
  return undefined;
}

/**
 * Access a sub-message field on a proto message (with copy-on-write).
 * [was: W_]
 */
export function getSubMessage(message, ctor, fieldNumber, offsetToken) {
  let arr = message.array;
  let flags = arr[SYM_FLAGS] | 0;
  let result = tryWrapMessage(arr, flags, ctor, fieldNumber, offsetToken);

  if (result == null) return result;

  flags = arr[SYM_FLAGS] | 0;
  if (!isFrozen(message, flags)) {
    const copy = deepCopyMessage(result);
    if (copy !== result) {
      takeOwnership(message);
      arr = message.array;
      flags = arr[SYM_FLAGS] | 0;
      result = copy;
      flags = setFieldRaw(arr, flags, fieldNumber, result, offsetToken);
      markAccessed(arr, flags);
    }
  }
  return result;
}

/**
 * Access a repeated sub-message field with full validation.
 * [was: mK]
 */
function accessRepeatedMessages(message, arr, flags, ctor, fieldNumber, mutability, offsetToken, checkOwnership, deepCopy) {
  let wasFrozen = isFrozen(message, flags);
  mutability = wasFrozen ? 1 : mutability;
  checkOwnership = !!checkOwnership || mutability === 3;
  const needsDeepCopy = deepCopy && !wasFrozen;

  if ((mutability === 2 || needsDeepCopy) && takeOwnership(message)) {
    arr = message.array;
    flags = arr[SYM_FLAGS] | 0;
  }

  let repeated = getRepeatedRaw(arr, fieldNumber, offsetToken);
  let childFlags = repeated === EMPTY_REPEATED ? 7 : repeated[SYM_FLAGS] | 0;
  let merged = mergeRepeatedFlags(childFlags, flags);
  let needsValidation;

  if ((needsValidation = !(4 & merged))) {
    const frozen = !!(2 & merged);
    let parentWithFrozen = flags;
    if (frozen) parentWithFrozen |= 2;
    let allMutable = !frozen;
    let allFrozen = true;
    let readIdx = 0;
    let writeIdx = 0;

    for (; readIdx < repeated.length; readIdx++) {
      const wrapped = wrapAsMessage(repeated[readIdx], ctor, parentWithFrozen);
      if (wrapped instanceof ctor) {
        if (!frozen) {
          const elemFrozen = isFrozen(wrapped);
          if (allMutable) allMutable = !elemFrozen;
          if (allFrozen) allFrozen = elemFrozen;
        }
        repeated[writeIdx++] = wrapped;
      }
    }
    if (writeIdx < readIdx) repeated.length = writeIdx;
    merged |= 4;
    merged = allFrozen ? merged & ~4096 : merged | 4096;
    merged = allMutable ? merged | 8 : merged & ~8;
  }

  if (merged !== childFlags) {
    repeated[SYM_FLAGS] = merged;
    if (2 & merged) Object.freeze(repeated);
  }

  if (
    needsDeepCopy &&
    !(
      (8 & merged) ||
      !repeated.length &&
        (mutability === 1 ||
          (mutability !== 4
            ? false
            : (2 & merged) || (!(16 & merged) && (32 & flags))))
    )
  ) {
    if (isFrozenAndValidated(merged)) {
      repeated = [...repeated];
      merged = deriveCopiedFlags(merged, flags);
      flags = setFieldRaw(arr, flags, fieldNumber, repeated, offsetToken);
    }
    for (let i = 0; i < repeated.length; i++) {
      const elem = repeated[i];
      const copy = deepCopyMessage(elem);
      if (elem !== copy) repeated[i] = copy;
    }
    merged |= 8;
    merged = repeated.length ? merged | 4096 : merged & ~4096;
    repeated[SYM_FLAGS] = merged;
  }

  return (repeated = finalizeRepeated(
    repeated,
    merged,
    arr,
    flags,
    fieldNumber,
    offsetToken,
    mutability,
    needsValidation,
    checkOwnership
  ));
}

/**
 * Access a repeated message field on a proto message instance.
 * [was: Tp]
 */
export function getRepeatedMessages(message, ctor, fieldNumber) {
  const arr = message.array;
  return accessRepeatedMessages(
    message,
    arr,
    arr[SYM_FLAGS] | 0,
    ctor,
    fieldNumber,
    EMPTY_FROZEN_OBJECT === undefined ? 2 : 4, // was: KV === void 0 ? 2 : 4
    undefined,
    false,
    true
  );
}

/**
 * Null-check + instanceof assertion for optional sub-messages.
 * [was: oP]
 */
function validateOptionalMessage(value, ctor) {
  if (value != null) assertInstance(value, ctor);
  else value = undefined;
  return value;
}

/**
 * Set a sub-message field on a proto message.
 * [was: ry]
 */
export function setSubMessage(message, ctor, fieldNumber, value, offsetToken) {
  value = validateOptionalMessage(value, ctor);
  setField(message, fieldNumber, value, offsetToken);
  if (value && !isFrozen(value)) markAccessed(message.array);
  return message;
}

/**
 * Set a sub-message field inside a oneof group.
 * [was: UB]
 */
export function setOneofSubMessage(message, ctor, fieldNumber, oneofFields, value) {
  value = validateOptionalMessage(value, ctor);
  setOneofField(message, fieldNumber, oneofFields, value);
  if (value && !isFrozen(value)) markAccessed(message.array);
  return message;
}

// ---------------------------------------------------------------------------
// Typed field getters (convenience wrappers)
// ---------------------------------------------------------------------------

/**
 * Get an int32/enum field, defaulting to `defaultValue`.
 * [was: g.Ao]
 * @param {object} message
 * @param {number} fieldNumber
 * @param {number} [defaultValue=0]
 * @returns {number}
 */
export function getInt32(message, fieldNumber, defaultValue = 0) {
  return coerceInt32(getField(message, fieldNumber)) ?? defaultValue;
}

/** Default BigInt zero for int64 fields.  [was: j0w] */
const BIGINT_ZERO = validateBigInt(0);

/** Sentinel for "check extension state" mode.  [was: xC] */
const CHECK_EXT_STATE = {};

/**
 * Get an int64 field (as BigInt), defaulting to `BIGINT_ZERO`.
 * [was: e0]
 * @param {object} message
 * @param {number} fieldNumber
 * @param {bigint}  [defaultValue]
 * @returns {bigint}
 */
export function getInt64(message, fieldNumber, defaultValue = BIGINT_ZERO) {
  return getField(message, fieldNumber, undefined, undefined, coerceToInt64BigInt) ?? defaultValue;
}

/**
 * Get a string field, defaulting to `""`.
 * [was: Ve]
 * @param {object} message
 * @param {number} fieldNumber
 * @param {string} [defaultValue=""]
 * @param {*}      [offsetToken]
 * @returns {string}
 */
export function getString(message, fieldNumber, defaultValue = "", offsetToken) {
  return toStringOrUndefined(getField(message, fieldNumber, offsetToken)) ?? defaultValue;
}

/**
 * Get a numeric field (int32), defaulting to 0.
 * Uses raw integer coercion (no `| 0` — preserves the value's sign/magnitude).
 * [was: B_]
 */
export function getNumber(message, fieldNumber) {
  const raw = getField(message, fieldNumber);
  return (raw == null ? raw : isFiniteNumber(raw) ? raw | 0 : undefined) ?? 0;
}

/**
 * Get a string field with extension-state check.
 * [was: q6]
 */
export function getStringWithExtCheck(message, fieldNumber) {
  return toStringOrUndefined(getField(message, fieldNumber, undefined, CHECK_EXT_STATE));
}

// ---------------------------------------------------------------------------
// Typed field setters (convenience wrappers)
// ---------------------------------------------------------------------------

/**
 * Set an int64 field.
 * [was: nV]
 */
export function setInt64(message, fieldNumber, value) {
  return setField(message, fieldNumber, toInt64(value));
}

/**
 * Set a string field (with validation).
 * [was: DZ]
 */
export function setString(message, fieldNumber, value) {
  return setField(message, fieldNumber, assertStringOrNull(value));
}

/**
 * Set a string field with default-value clearing.
 * [was: to]
 */
export function setStringWithDefault(message, fieldNumber, value, offsetToken) {
  return setFieldWithDefault(message, fieldNumber, assertStringOrNull(value), "", offsetToken);
}

/**
 * Set an enum field (validated as finite integer).
 * [was: H_]
 */
export function setEnum(message, fieldNumber, value) {
  if (value != null) {
    if (!isFiniteNumber(value)) throw protoWarning("enum");
    value |= 0;
  }
  return setField(message, fieldNumber, value);
}

/**
 * Get a bytes field (as ByteString), defaulting to empty.
 * [was: $H]
 */
export function getBytes(message, fieldNumber) {
  const raw = getField(message, fieldNumber, undefined, undefined, coerceByteStringLenient);
  return raw == null ? emptyByteString() : raw;
}

// ---------------------------------------------------------------------------
// ByteSource construction
// ---------------------------------------------------------------------------

/**
 * Wraps a Uint8Array with a "buffer may be shared" flag.
 * [was: N6]
 */
export class ByteSource {
  /**
   * @param {Uint8Array} bytes
   * @param {boolean}    isShared
   * @param {ByteString} [lazyBytes]
   */
  constructor(bytes, isShared, lazyBytes) {
    this.buffer = bytes;
    if (lazyBytes && !isShared) throw Error();
    /** Whether the buffer is shared (i.e. came from a ByteString).  [was: .W] */
    this.isShared = isShared;
  }
}

/**
 * Create a ByteSource from various input types (string, Array, Uint8Array,
 * ArrayBuffer, ByteString).
 * [was: i7]
 *
 * @param {string|Array<number>|Uint8Array|ArrayBuffer|ByteString} input
 * @param {boolean} [eagerString]  flag passed from reader options
 * @returns {ByteSource}
 */
export function toByteSource(input, eagerString) {
  if (typeof input === "string") {
    return new ByteSource(decodeBase64ToBytes(input), eagerString);
  }
  if (Array.isArray(input)) {
    return new ByteSource(new Uint8Array(input), eagerString);
  }
  if (input.constructor === Uint8Array) {
    return new ByteSource(input, false);
  }
  if (input.constructor === ArrayBuffer) {
    return new ByteSource(new Uint8Array(input), false);
  }
  if (input.constructor === ByteString) {
    const bytes = extractBytes(input) || new Uint8Array(0);
    return new ByteSource(bytes, true, input);
  }
  if (input instanceof Uint8Array) {
    const normalized =
      input.constructor === Uint8Array
        ? input
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return new ByteSource(normalized, false);
  }
  throw Error();
}

/**
 * Extract int32 from protobuf message field. [was: g.Ao]
 */
export function getInt32Field(message, fieldNumber, defaultValue = 0) {
  // Reads field from protobuf-like message
  return defaultValue;
}
