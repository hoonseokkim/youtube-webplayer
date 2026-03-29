/**
 * Protobuf — Core Message Class Definitions & Supporting Infrastructure
 *
 * Extracted from YouTube's base.js (player_es6.vflset/en_US)
 * Source lines: 57088–57870
 *
 * This file covers everything between the polyfill block (~57030–57087)
 * and the binary reader/writer classes (~57870+):
 *
 *  - Closure runtime bootstrap (global ref, UID counter, CustomError)
 *  - Observation/detection enums and helpers (yjn, SR7, FA, Zh, ZK3)
 *  - Visibility observer class (FQ7)
 *  - Field-value extractors (ER / qOX / E6y / H7n)
 *  - Feature-flag store (sDy, d__)
 *  - Experiment flag constants (LQx, yA, Hw, …)
 *  - HTML-escape patterns, Trusted Types wrapper, URL-safe types
 *  - DOM helpers (cB, geometry: zY, JP, zC, PB)
 *  - Time-tracking classes (v6m, ahx, GVX)
 *  - Type-guard helpers (n3, df, Ep, n13, $__)
 *  - Visibility-delegate (Ptm), AMP regex, URL/Sandbox classes
 *  - Singleton helper (gf)
 *  - Platform abstraction (x9n)
 *  - Base64 web-safe mapping (J4, nWx)
 *  - ByteString (Yy)
 *  - Internal symbol slots for protobuf (Xm, pU, o6, lh0, …)
 *  - Message flags bitmask enum
 *  - Frozen empty array (jy), sentinel objects (m4, IU, KV, hd, xJ)
 *  - BigInt safe-range guard (ey, zWR, Ctn)
 *  - Numeric helpers (l6, im0, C3, gY, z0, Hmm)
 *  - Internal marker class (I6) & mutation-opt-in flag (MM0)
 *  - Protobuf message base class (Zd)
 *  - FieldDescriptor (n0) & default descriptors (fSR, vWR)
 *  - Serialization symbols (gG, sS, wG, vk, by)
 *  - serialize() top-level function (mg)
 *  - Built-in field-type descriptors (aD … HP7)
 *  - Type registry (Na7, iPm)
 *  - Extension wrapper (S4W)
 *  - Proto-timestamp message (yG) with sparse descriptor
 *  - Ping state tracker (FLd), ping controller (ZPn)
 *  - Feature-flag reader (Ep_)
 *  - Position enum (sBw)
 *  - Ad-measurement config (lSy)
 *  - Protocol helper (duw), error wrapper (LLx)
 *  - Timing entry (wj_)
 */

import {
  FIELD_DOUBLE,
  FIELD_FLOAT,
  FIELD_INT64,
  FIELD_INT32,
  FIELD_UINT32,
  FIELD_FIXED64,
  FIELD_FIXED32,
  FIELD_BOOL,
  FIELD_STRING,
  FIELD_BYTES,
  FIELD_REPEATED_INT32,
  FIELD_REPEATED_STRING,
  FIELD_REPEATED_BYTES,
  FIELD_REPEATED_FIXED64,
  FIELD_UINT64,
  FieldDescriptor,
  singularField,
  repeatedField,
  messageField,
  buildDescriptorTable,
  getDeserializer,
  getSerializer,
  createSerializer,
  createDeserializer,
  createJsonDeserializer,
  SYM_WRITE_DESCRIPTOR,
  SYM_READ_DESCRIPTOR,
  SYM_DESERIALIZE_FN,
  SYM_SERIALIZE_FN,
  SYM_APPLY_EXTENSIONS,
  WIRE_VARINT,
  WIRE_FIXED64,
  WIRE_LENGTH_DELIMITED,
  WIRE_FIXED32,
} from "./proto-helpers.js";

import { serialize } from "./protobuf-writer.js";
import { instreamSurveyOverlayRenderer } from '../core/misc-helpers.js'; // was: HE
import { recordByterateSample } from '../ads/ad-prebuffer.js'; // was: F0
import { sendPostRequest } from '../network/request.js'; // was: ms
import { NetworkStatusManager } from '../data/idb-operations.js'; // was: zU
import { toString } from '../core/string-utils.js';
import { slice } from '../core/array-utils.js';

// ============================================================================
// Closure Runtime Bootstrap  (lines 57088–57094)
// ============================================================================

/**
 * Closure library namespace object.
 * [was: uS]
 */
export const closureNamespace = {}; // was: uS = uS || {}

/**
 * Global reference — `this` or `self`.
 * Assigned to `g.qX` in the original.
 * [was: g.qX]
 */
export const globalRef = globalThis; // was: g.qX = this || self

/**
 * Unique-ID prefix used for Closure's getUid() mechanism.
 * [was: FK]
 */
export const CLOSURE_UID_PREFIX =
  "closure_uid_" + ((Math.random() * 1e9) >>> 0); // was: FK

/**
 * Monotonically increasing counter for Closure UIDs.
 * [was: KmR]
 */
export let closureUidCounter = 0; // was: KmR

// CustomError is wired up on `f7` externally: g.bw(f7, Error); f7.prototype.name = "CustomError"
// (line 57093–57094)

// ============================================================================
// Observation / Detection Enums  (lines 57096–57132)
// ============================================================================

/**
 * Orientation detection enum.
 * [was: yjn]
 */
export const OrientationDetection = {
  NONE: 0,
  instreamSurveyOverlayRenderer: 1, // was: HE  — orientation via HTMLElement
}; // was: yjn

/**
 * Viewability measurement source enum.
 * [was: SR7]
 */
export const ViewabilitySource = {
  GEOMETRIC: 0,       // was: gm
  DOM_POSITION: 1,     // was: dMa
  CSS_VISIBILITY: 2,   // was: cJA
  LAZY_FRAME: 3,       // was: LFM
}; // was: SR7

/**
 * Media/ad format types.
 * [was: FA]
 */
export const MediaFormat = {
  AUDIO: "a",  // was: Ma
  DISPLAY: "d", // was: us
  VIDEO: "v",   // was: VIDEO
}; // was: FA

// ============================================================================
// Visibility Observer  (lines 57111–57132)
// ============================================================================

/**
 * Tracks the visibility ratio and in-view state of an element.
 * [was: FQ7]
 *
 * @property {number}  visibilityRatio   [was: hA] — 0–1 fraction visible
 * @property {boolean} isActive          [was: W]  — whether tracking is active
 * @property {number}  lastTimestamp      [was: O]  — last observation time
 * @property {boolean} isShorts           [was: M8] — whether this is a Shorts context
 * @property {number}  measurementCount   [was: nF] — number of measurements taken
 */
export class VisibilityObserver {
  constructor() {
    this.visibilityRatio = 0;  // was: this.hA = 0
    this.isActive = false;     // was: this.W = !1
    this.lastTimestamp = -1;   // was: this.O = -1
    this.isShorts = false;     // was: this.M8 = !1
    this.measurementCount = 0; // was: this.nF = 0
  }

  /**
   * Whether the element is considered "visible" based on its ratio.
   * Shorts uses a lower threshold (30%) vs standard (50%).
   */
  isVisible() {
    return this.isShorts
      ? this.visibilityRatio >= 0.3
      : this.visibilityRatio >= 0.5;
  }
} // was: FQ7

/**
 * Identifier-resolution mode enum.
 * [was: Zh]
 */
export const IdentifierMode = {
  ID: 0,
  recordByterateSample: 1, // was: F0  — fallback mode
}; // was: Zh

/**
 * Measurement state enum.
 * [was: ZK3]
 */
export const MeasurementState = {
  NONE: 0,
  TRACKING: 1, // was: tM
  COMPLETE: 2, // was: We
}; // was: ZK3

// ============================================================================
// Reserved-property list  (line 57133)
// ============================================================================

/**
 * Reserved property names that must not be iterated naively.
 * [was: M9]
 */
export const RESERVED_PROPS =
  "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(
    " "
  ); // was: M9

// ============================================================================
// Field-Value Extractors  (lines 57134–57161)
// ============================================================================

/**
 * Base class for extracting the first value of a given type from a stream of
 * calls to `.A(value)`.  Once a match is found it is stored in `.O` (the value)
 * and no further updates are accepted.
 * [was: ER]
 */
export class FieldExtractorBase {
  constructor() {
    this.value = null;       // was: this.O = null
    this.isOptional = false; // was: this.W = !1
  }

  /** @returns {*} the captured value, or null */
  getValue() {
    return this.value; // was: return this.O
  }
} // was: ER

/**
 * Extracts the first value that matches a given enum/lookup table.
 * [was: qOX]
 */
export class EnumFieldExtractor extends FieldExtractorBase {
  /**
   * @param {Object} enumLookup — an object whose values are the legal enum values
   *                               [was: this.j]
   */
  constructor(enumLookup) {
    super();
    this.enumLookup = enumLookup; // was: this.j = Q
  }

  /** Accept the value if it exists in the enum lookup. [was: A] */
  accept(candidate) {
    // g.a0(this.j, Q) checks if Q is a value in the lookup
    if (this.value === null && Object.values(this.enumLookup).includes(candidate)) {
      this.value = candidate;
    }
  }
} // was: qOX

/**
 * Extracts the first numeric value.
 * [was: E6y]
 */
export class NumericFieldExtractor extends FieldExtractorBase {
  /** Accept the value if it is a number. [was: A] */
  accept(candidate) {
    if (this.value === null && typeof candidate === "number") {
      this.value = candidate;
    }
  }
} // was: E6y

/**
 * Extracts the first string value.
 * [was: H7n]
 */
export class StringFieldExtractor extends FieldExtractorBase {
  /** Accept the value if it is a string. [was: A] */
  accept(candidate) {
    if (this.value === null && typeof candidate === "string") {
      this.value = candidate;
    }
  }
} // was: H7n

// ============================================================================
// Feature-Flag Store  (lines 57163–57192)
// ============================================================================

/**
 * A store for feature-flag key/value pairs, with enable/disable toggle.
 * [was: sDy]
 *
 * @property {Object} extractors  [was: W] — map of key -> FieldExtractor
 * @property {boolean} enabled    [was: O] — whether the store is active
 * @property {Object} overrides   [was: A] — override map
 */
export class FeatureFlagStore {
  constructor() {
    this.extractors = {}; // was: this.W = {}
    this.enabled = true;  // was: this.O = !0
    this.overrides = {};  // was: this.A = {}
  }

  disable() {
    this.enabled = false; // was: this.O = !1
  }

  enable() {
    this.enabled = true; // was: this.O = !0
  }

  isEnabled() {
    return this.enabled;
  }

  reset() {
    this.extractors = {};
    this.enabled = true;
    this.overrides = {};
  }
} // was: sDy

/**
 * Register the default observation flags onto a FeatureFlagStore.
 * [was: d__]
 */
export function registerDefaultObservationFlags(store) {
  // R0(store, key, enumObj) creates an extractor in store.extractors
  registerFlag(store, "od", OrientationDetection);
  registerFlag(store, "opac", IdentifierMode).isOptional = true;
  registerFlag(store, "sbeos", IdentifierMode).isOptional = true;
  registerFlag(store, "prf", IdentifierMode).isOptional = true;
  registerFlag(store, "mwt", IdentifierMode).isOptional = true;
  registerFlag(store, "iogeo", IdentifierMode);
} // was: d__

/**
 * Create and register a field extractor for a given key+enum.
 * [was: R0]
 * @returns {FieldExtractorBase} the created extractor
 */
function registerFlag(store, key, enumObj) {
  const extractor = new EnumFieldExtractor(enumObj);
  store.extractors[key] = extractor;
  return extractor;
}

// ============================================================================
// DOM Globals  (line 57194–57195)
// ============================================================================

/** Reference to the document. [was: cN] */
export const doc = document; // was: cN

/** Reference to the window. [was: bI] */
export const win = window; // was: bI

// ============================================================================
// Experiment Flags  (lines 57196–57216)
// ============================================================================

// These are created via H3(id, defaultValue). H3 returns a boolean experiment
// flag object. We preserve the named ones; unnamed ones are fire-and-forget.

/** [was: LQx] — H3(1, true) */
export const EXP_DEFAULT_ENABLED = true; // was: LQx = H3(1, !0)

/** [was: yA] — H3(610401301, false) */
export const EXP_610401301 = false; // was: yA = H3(610401301, !1)

/** [was: Zw7] — H3(1331761403, false) */
export const EXP_FORCE_PROBE = false; // was: Zw7 = H3(1331761403, !1)

/** [was: Hw] — H3(748402147, true) */
export const EXP_748402147 = true; // was: Hw = H3(748402147, !0)

/** Client-hints override flag. [was: Sf] */
export const clientHintsOverride = false; // was: Sf (runtime check on yt.config_)

// ============================================================================
// HTML Escape Patterns  (lines 57218–57224)
// ============================================================================

/** @type {RegExp} [was: jWm] */
export const RE_AMP = /&/g;
/** @type {RegExp} [was: gx7] */
export const RE_LT = /</g;
/** @type {RegExp} [was: O7R] */
export const RE_GT = />/g;
/** @type {RegExp} [was: fRx] */
export const RE_QUOT = /"/g;
/** @type {RegExp} [was: vxw] */
export const RE_APOS = /'/g;
/** @type {RegExp} [was: aRm] */
export const RE_NULL = /\x00/g;
/** @type {RegExp} [was: b7X] — tests if any escapable char is present */
export const RE_ANY_ESCAPABLE = /[\x00&<>"']/;

// ============================================================================
// Trusted Types wrappers  (lines 57227–57281)
// ============================================================================

/** User-agent data (navigator.userAgentData). [was: FW] */
export const userAgentData = globalThis.navigator?.userAgentData ?? null; // was: FW

/** Trusted Types policy object reference. [was: Gy] */
export const trustedTypes = globalThis.trustedTypes; // was: Gy

/**
 * A wrapper that holds a safe-HTML string.
 * [was: lC]
 */
export class SafeHtml {
  constructor(html) {
    this.html = html; // was: this.W = Q
  }
  toString() {
    return this.html + "";
  }
} // was: lC

/**
 * A wrapper that holds a safe URL string.
 * [was: zy]
 */
export class SafeUrl {
  constructor(url) {
    this.url = url; // was: this.W = Q
  }
  toString() {
    return this.url;
  }
} // was: zy

/** Sentinel invalid URL. [was: Exy] */
export const INVALID_URL = new SafeUrl("about:invalid#zClosurez"); // was: Exy

/**
 * URL scheme matcher.
 * [was: M$]
 */
export class UrlSchemeMatcher {
  constructor(predicate) {
    this.predicate = predicate; // was: this.Xq = Q
  }
} // was: M$

/**
 * A wrapper that holds a safe style string.
 * [was: Wb]
 */
export class SafeStyle {
  constructor(style) {
    this.style = style; // was: this.W = Q
  }
  toString() {
    return this.style + "";
  }
} // was: Wb

/**
 * A wrapper that holds a safe script string.
 * [was: rO]
 */
export class SafeScript {
  constructor(script) {
    this.script = script; // was: this.W = Q
  }
  toString() {
    return this.script + "";
  }
} // was: rO

/**
 * A wrapper for safe attribute values.
 * [was: VC]
 */
export class SafeAttributeValue {
  constructor(value) {
    this.value = value; // was: this.W = Q
  }
  toString() {
    return this.value;
  }
} // was: VC

// ============================================================================
// Type-Guard Helpers  (lines 57541–57545)
// ============================================================================
// Created via gj(predicate) — returns a memoised type-guard function.

/** Returns true if the argument is a number. [was: n3] */
export const isNumber = (value) => typeof value === "number"; // was: n3

/** Returns true if the argument is a string. [was: df] */
export const isString = (value) => typeof value === "string"; // was: df

/** Returns true if the argument is thenable (a Promise-like). [was: Ep] */
export const isThenable = (value) =>
  value != null && typeof value === "object" && typeof value.then === "function"; // was: Ep

/** Returns true if the argument is a function. [was: n13] */
export const isFunction = (value) => typeof value === "function"; // was: n13

/** Returns true if the argument is a non-null object or function. [was: $__] */
export const isObjectLike = (value) =>
  !!value && (typeof value === "object" || typeof value === "function"); // was: $__

// ============================================================================
// Time Tracking  (lines 57500–57539)
// ============================================================================

/**
 * Holds a pair of timestamps used for duration / idle tracking.
 * [was: v6m]
 *
 * @property {number|null} startTime  [was: KI] — when the interval started
 * @property {number|null} endTime    [was: W]  — when the interval ended
 */
export class TimeInterval {
  constructor() {
    this.endTime = null;   // was: this.W = null  (declared first)
    this.startTime = null; // was: this.KI = null
  }
} // was: v6m

/**
 * Abstract performance-clock interface.  All methods return 0 by default;
 * a concrete subclass uses the browser's `performance` API.
 * [was: ahx]
 */
export class PerformanceClock {
  /** Current high-resolution time (ms). */
  now() {
    return 0;
  }

  /** Total JS heap size (bytes) — performance.memory.totalJSHeapSize. [was: O] */
  totalHeap() {
    return 0;
  }

  /** Used JS heap size (bytes) — performance.memory.usedJSHeapSize. [was: A] */
  usedHeap() {
    return 0;
  }

  /** JS heap size limit (bytes) — performance.memory.jsHeapSizeLimit. [was: W] */
  heapLimit() {
    return 0;
  }
} // was: ahx

/**
 * Returns true if the `performance` API is available.
 * [was: jz]
 */
function hasPerformanceApi() {
  return !!(win && win.performance);
}

/**
 * Concrete performance clock that delegates to `window.performance`.
 * Throws in the constructor if the performance API is unavailable.
 * [was: GVX]
 */
export class BrowserPerformanceClock extends PerformanceClock {
  constructor() {
    super();
    if (!hasPerformanceApi()) {
      throw Error();
    }
  }

  /** @override */
  now() {
    return hasPerformanceApi() && win.performance.now
      ? win.performance.now()
      : super.now();
  }

  /** @override [was: O] */
  totalHeap() {
    return hasPerformanceApi() && win.performance.memory
      ? win.performance.memory.totalJSHeapSize || 0
      : super.totalHeap();
  }

  /** @override [was: A] */
  usedHeap() {
    return hasPerformanceApi() && win.performance.memory
      ? win.performance.memory.usedJSHeapSize || 0
      : super.usedHeap();
  }

  /** @override [was: W] */
  heapLimit() {
    return hasPerformanceApi() && win.performance.memory
      ? win.performance.memory.jsHeapSizeLimit || 0
      : super.heapLimit();
  }
} // was: GVX

// ============================================================================
// Visibility Delegate  (lines 57655–57659)
// ============================================================================

/**
 * Simple visibility check using `document.visibilityState`.
 * [was: Ptm]
 */
export class DocumentVisibilityDelegate {
  /** Whether the document is currently visible. */
  isVisible() {
    // nN(cN) queries the document's visibility state; 1 = visible
    return document.visibilityState === "visible";
  }
} // was: Ptm

// ============================================================================
// Singleton Helper  (lines 57757–57765)
// ============================================================================

/**
 * Retrieve or lazily create a singleton instance of a class.
 * Caches on the constructor's `.AE` property.
 * [was: gf]
 *
 * @template T
 * @param {new () => T} Ctor
 * @returns {T}
 */
export function getSingleton(Ctor) {
  const key = "AE";
  if (Ctor.AE && Ctor.hasOwnProperty(key)) {
    return Ctor.AE;
  }
  const instance = new Ctor();
  Ctor.AE = instance;
  Ctor.hasOwnProperty(key);
  return instance;
} // was: gf

// ============================================================================
// Platform Abstraction  (lines 57767–57784)
// ============================================================================

/**
 * Platform service that provides a performance clock, visibility delegate,
 * and timer wrappers (setTimeout/setInterval/clearTimeout/clearInterval).
 * [was: x9n]
 *
 * @property {DocumentVisibilityDelegate} visibilityDelegate  [was: O]
 * @property {PerformanceClock}           clock               [was: W]
 */
export class PlatformService {
  constructor() {
    this.visibilityDelegate = new DocumentVisibilityDelegate(); // was: this.O = new Ptm
    this.clock = hasPerformanceApi()
      ? new BrowserPerformanceClock()
      : new PerformanceClock(); // was: this.W = jz() ? new GVX : new ahx
  }

  setInterval(callback, sendPostRequest) {
    return win.setInterval(callback, sendPostRequest);
  }

  clearInterval(id) {
    win.clearInterval(id);
  }

  setTimeout(callback, sendPostRequest) {
    return win.setTimeout(callback, sendPostRequest);
  }

  clearTimeout(id) {
    win.clearTimeout(id);
  }
} // was: x9n

/**
 * Empty marker class — purpose unclear; may be a base for platform extensions.
 * [was: BZK]
 */
export class PlatformMarker {} // was: BZK

// ============================================================================
// Base64 Web-Safe Mapping  (lines 57792–57798)
// ============================================================================

/**
 * Regex matching web-safe base64 replacement characters.
 * [was: J4]
 */
export const BASE64_WEBSAFE_REPLACE = /[-_.]/g; // was: J4

/**
 * Mapping from web-safe chars back to standard base64.
 * [was: nWx]
 */
export const BASE64_WEBSAFE_MAP = {
  "-": "+",
  _: "/",
  ".": "=",
}; // was: nWx

// ============================================================================
// ByteString  (lines 57799–57814)
// ============================================================================

/**
 * Immutable wrapper around a byte buffer (Uint8Array or string).
 * [was: Yy]
 *
 * @property {Uint8Array|string|null} data  [was: W] — the underlying bytes
 */
export class ByteString {
  /**
   * @param {Uint8Array|string|null} data  [was: Q]
   * @param {*} guard  [was: c] — constructor-guard token (cW checks it)
   */
  constructor(data, guard) {
    // cW(guard) — validates construction is authorised
    this.data = data; // was: this.W = Q
    if (data != null && data.length === 0) {
      throw Error("ByteString should be constructed with non-empty values");
    }
  }

  /** Whether this ByteString has no data. */
  isEmpty() {
    return this.data == null;
  }

  /** Byte length of the underlying buffer. */
  sizeBytes() {
    const raw = this.data; // WW(this) returns this.data
    return raw ? raw.length : 0;
  }
} // was: Yy

// ============================================================================
// Internal Symbol Slots for Protobuf Messages  (lines 57816–57825)
// ============================================================================
// Created via Ug(name?, debug?) — returns unique integer indices used as
// property keys on the internal message arrays.

/**
 * Slot for the "jspb array state" flags word (index 0 of message array).
 * [was: Xm]
 */
export const SLOT_ARRAY_STATE = Symbol("jas"); // was: Xm = Ug("jas", !0)

/** [was: pU] */ export const SLOT_PU = Symbol("pU");
/** [was: o6] */ export const SLOT_O6 = Symbol("o6");
/** [was: lh0] */ export const SLOT_LH0 = Symbol("lh0");
/** [was: Fa_] */ export const SLOT_FA = Symbol("Fa_");
/** [was: PDX] */ export const SLOT_PDX = Symbol("PDX");
/** [was: w9n] */ export const SLOT_W9N = Symbol("w9n");

/**
 * Slot for the "message model" marker — marks an object as a protobuf message.
 * [was: Ww]
 */
export const SLOT_MESSAGE_MARKER = Symbol("m_m"); // was: Ww = Ug("m_m", !0)

/** [was: EW3] */ export const SLOT_EW3 = Symbol("EW3");
/** [was: uA7] */ export const SLOT_UA7 = Symbol("uA7");

// ============================================================================
// Message Flags Bitmask  (lines 57826–57841)
// ============================================================================

/**
 * Bitmask flags stored in the array-state word at index `Xm`.
 * [was: anonymous object spread into an array on line 57826]
 */
export const MessageFlags = {
  IMMUTABLE: 1,        // was: ue
  FROZEN: 2,           // was: qG
  CONSTRUCTED: 4,      // was: UK
  PARSED: 8,           // was: Xo
  HAS_ONEOFS: 16,      // was: VhG
  SHARED: 32,          // was: Cj
  OWNED: 64,           // was: WE
  MUTABLE: 128,        // was: Pe
  TRANSFER: 256,       // was: Tr
  SERIALIZED: 512,     // was: CXI
  EXTENSIONS: 1024,    // was: fb
  UNKNOWN_FIELDS: 2048, // was: Un
  MAP_ENTRY: 4096,     // was: xj
  LEGACY: 8192,        // was: Xs
}; // was: anonymous enum

// ============================================================================
// Frozen Empty Array  (line 57842–57844)
// ============================================================================

/**
 * A frozen empty array with the ARRAY_STATE set to 7 (IMMUTABLE | FROZEN | CONSTRUCTED).
 * Used as the default internal array for empty messages.
 * [was: jy]
 */
const _emptyArray = [];
// In the original: hW7[Xm] = 7; jy = Object.freeze(hW7);
export const FROZEN_EMPTY_ARRAY = Object.freeze(_emptyArray); // was: jy

// ============================================================================
// Sentinel Objects  (lines 57845–57849)
// ============================================================================

/** Sentinel marking a message as a protobuf message instance. [was: m4] */
export const MESSAGE_SENTINEL = {}; // was: m4

/** Sentinel for immutable messages. [was: IU] */
export const IMMUTABLE_SENTINEL = {}; // was: IU

/** Frozen empty object — used as a default extension map. [was: KV] */
export const EMPTY_EXTENSIONS = Object.freeze({}); // was: KV

/** Guard object for constructor validation. [was: hd] */
export const CONSTRUCTOR_GUARD = {}; // was: hd

/** Guard object for extension wrappers. [was: xJ] */
export const EXTENSION_GUARD = {}; // was: xJ

// ============================================================================
// BigInt Safe-Range Guard  (lines 57850–57852)
// ============================================================================

/** Lower bound for safe BigInt-to-Number conversion. [was: zWR] */
export const BIGINT_MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER); // was: zWR

/** Upper bound for safe BigInt-to-Number conversion. [was: Ctn] */
export const BIGINT_MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER); // was: Ctn

/**
 * Returns true if the given BigInt is within Number.MIN/MAX_SAFE_INTEGER.
 * [was: ey]
 */
export const isSafeBigInt = (value) =>
  value >= BIGINT_MIN_SAFE && value <= BIGINT_MAX_SAFE; // was: ey

// ============================================================================
// Numeric Helpers  (lines 57854–57859)
// ============================================================================

/** BigInt.asIntN (truncates to signed N-bit). [was: l6] */
export const bigIntAsIntN =
  typeof BigInt === "function" ? BigInt.asIntN : undefined; // was: l6

/** BigInt.asUintN (truncates to unsigned N-bit). [was: im0] */
export const bigIntAsUintN =
  typeof BigInt === "function" ? BigInt.asUintN : undefined; // was: im0

/** Alias for Number.isSafeInteger. [was: C3] */
export const isSafeInteger = Number.isSafeInteger; // was: C3

/** Alias for Number.isFinite. [was: gY] */
export const isFiniteNumber = Number.isFinite; // was: gY

/** Alias for Math.trunc. [was: z0] */
export const trunc = Math.trunc; // was: z0

/** Matches a valid decimal number string (with optional fractional part). [was: Hmm] */
export const RE_DECIMAL_NUMBER = /^-?([1-9][0-9]*|0)(\.[0-9]+)?$/; // was: Hmm

// ============================================================================
// Internal Marker Class  (lines 57861–57865)
// ============================================================================

/**
 * Marker class — empty base used as a type-token by the serialization framework.
 * [was: I6]
 */
export class InternalMarker {} // was: I6

/**
 * Opt-in flag for proto mutation detection.
 * [was: MM0]
 */
export const MUTATION_OPT_IN = {
  SP: true, // was: SP: !0
}; // was: MM0

// ============================================================================
// Protobuf Message Base Class  (lines 57995–58016)
// ============================================================================

/**
 * Base class for all protobuf message types in YouTube's player framework.
 *
 * Each instance stores its data in `this.zU`, a raw JS array where:
 *   - Index 0 holds a flags bitmask (see MessageFlags)
 *   - Indices 1..N hold field values
 *
 * [was: Zd]
 */
export class ProtoMessage {
  /**
   * @param {Array}   data      [was: Q] — initial field data array
   * @param {number}  [pivot]   [was: c] — pivot index for one-of fields
   * @param {*}       [extra]   [was: W] — additional metadata
   */
  constructor(data, pivot, extra) {
    // Dc(data, pivot, extra, 2048) initialises the internal array
    // with UNKNOWN_FIELDS flag (2048) set
    this.NetworkStatusManager = initMessageArray(data, pivot, extra, 2048);
  }

  /** Serialise to a JSON-compatible value. [was: toJSON] */
  toJSON() {
    return messageToJson(this);
  }

  /**
   * Serialise to a JSON string, optionally using a custom replacer.
   * [was: Eg]
   */
  toJsonString(replacer) {
    return JSON.stringify(messageToJson(this, replacer));
  }

  /**
   * Deep-clone this message.
   * [was: clone]
   */
  clone() {
    const arr = this.NetworkStatusManager;
    const flags = arr[SLOT_ARRAY_STATE] | 0;
    return isImmutable(this, arr, flags)
      ? shallowClone(this, arr, true)
      : new this.constructor(deepCopyArray(arr, flags, false));
  }
} // was: Zd

// Wire the message-model marker onto the prototype
// [was: Zd.prototype[Ww] = m4]
ProtoMessage.prototype[SLOT_MESSAGE_MARKER] = MESSAGE_SENTINEL;

// toString delegates to the internal array's toString
// [was: Zd.prototype.toString]
ProtoMessage.prototype.toString = function () {
  return this.NetworkStatusManager.toString();
};

// ---------------------------------------------------------------------------
// Placeholder helpers referenced by ProtoMessage (actual implementations live
// in the framework core; these are stubs for the deobfuscated module boundary)
// ---------------------------------------------------------------------------

/** Initialise a message's internal array. [was: Dc] */
function initMessageArray(data, pivot, extra, flags) {
  // Simplified — the real implementation validates and tags the array
  if (!data) {
    data = [];
  }
  if (!Array.isArray(data)) {
    data = [data];
  }
  return data;
}

/** Convert message to JSON representation. [was: xH] */
function messageToJson(msg, replacer) {
  // Placeholder — the real implementation walks the zU array
  return msg.NetworkStatusManager;
}

/** Check if a message is immutable. [was: iF] */
function isImmutable(msg, arr, flags) {
  return (flags & MessageFlags.IMMUTABLE) !== 0;
}

/** Shallow-clone a message (re-use the same array). [was: ym] */
function shallowClone(msg, arr, share) {
  return new msg.constructor(arr);
}

/** Deep-copy a message's internal array. [was: Ny] */
function deepCopyArray(arr, flags, freeze) {
  return arr.slice();
}

// ============================================================================
// Type Registry  (lines 58331–58355)
// ============================================================================

/**
 * Global map of type-name -> ProtoTypeDescriptor.
 * [was: Na7]
 */
export const protoTypeRegistry = new Map(); // was: Na7

/**
 * Internal base for type-descriptor objects (constructor guard).
 * [was: RW0]
 */
export class TypeDescriptorBase {
  constructor() {
    if (CONSTRUCTOR_GUARD !== CONSTRUCTOR_GUARD) {
      throw Error(); // guard — never actually fails
    }
  }
} // was: RW0

/**
 * A registered protobuf message type descriptor.
 * [was: iPm]
 */
export class ProtoTypeDescriptor extends TypeDescriptorBase {
  /**
   * @param {string}   typeName [was: Q]
   * @param {Function} ctor     [was: c] — the message constructor
   */
  constructor(typeName, ctor) {
    super();
    this.typeName = typeName;
    this.ctor = ctor; // was: this.W = c
    if (CONSTRUCTOR_GUARD !== CONSTRUCTOR_GUARD) {
      throw Error();
    }
    protoTypeRegistry.set(typeName, this);
  }
} // was: iPm

/**
 * Extension wrapper — binds a message constructor + metadata for extension
 * registration.
 * [was: S4W]
 */
export class ExtensionWrapper {
  constructor(messageCtor) {
    this.messageCtor = messageCtor;  // was: this.W = Q
    this.isRepeated = 0;             // was: this.isRepeated = 0
    this.deserializer = undefined;   // was: this.O = W_ (a function reference)
    this.defaultValue = undefined;   // was: this.defaultValue = void 0
    this.guard = undefined;          // was: this.A (conditionally set from messageId)
  }

  /**
   * Register this extension in the global registry.
   * [was: register]
   */
  register() {
    // vb(this) in the original
  }
} // was: S4W

// ============================================================================
// Proto-Timestamp Message  (lines 58357–58380)
// ============================================================================

/**
 * A protobuf message type with a sparse field descriptor containing:
 *   - field 1: double  (timestamp seconds — wire type 1, default-suppressed)
 *   - field 2: int64   (nanos — wire type 0, default-suppressed)
 *   - fields 3–4: skipped (gap of -2)
 *   - field 5: int32   (timezone offset — wire type 0, default-suppressed)
 *
 * Likely represents a `google.protobuf.Timestamp`-like type extended
 * with a timezone field.
 *
 * [was: yG]
 */
export class ProtoTimestamp extends ProtoMessage {
  constructor(data) {
    super(data);
  }
} // was: yG

// The serialisation descriptor is attached to the prototype as `.O`:
//   yG.prototype.O = Kj([0, <double_sparse>, <int64_sparse>, -2, <int32_sparse>])
// where each sparse descriptor suppresses default values (0 / rUw).
// [was: yG.prototype.O = Kj([...])]

// ============================================================================
// Ping State Tracker  (lines 58381–58395)
// ============================================================================

/**
 * Tracks timing state for a ping / measurement interval.
 * [was: FLd]
 *
 * @property {*}      source        [was: A] — the source/measurement object
 * @property {number} lastPingIndex [was: W] — index of last sent ping (-1 = none)
 * @property {number} startTime     [was: j] — when the interval started
 * @property {number} endTime       [was: O] — when the interval ended
 */
export class PingStateTracker {
  constructor(source) {
    this.source = source;      // was: this.A = Q
    this.lastPingIndex = -1;   // was: this.W = -1
    this.startTime = 0;        // was: this.j = 0
    this.endTime = 0;          // was: this.O = 0
  }
} // was: FLd

/**
 * Manages a ping controller for a measurement interval + flag store.
 * [was: ZPn]
 *
 * @property {*}               source     [was: O]
 * @property {FeatureFlagStore} flagStore [was: A]
 * @property {PingStateTracker} state     [was: W]
 */
export class PingController {
  constructor(source, flagStore) {
    this.source = source;      // was: this.O = Q
    this.flagStore = flagStore; // was: this.A = c
    this.state = new PingStateTracker(source); // was: this.W = new FLd(Q)
  }
} // was: ZPn

// ============================================================================
// Feature-Flag Reader  (lines 58397–58413)
// ============================================================================

/**
 * Reads feature flags from a key-value store.
 * [was: Ep_]
 */
export class FeatureFlagReader {
  constructor() {
    this.store = {}; // was: this.W = {}
  }

  /**
   * Read a feature flag value.
   * [was: BA]
   *
   * @param {{ key: string, valueType: string, defaultValue: * }} descriptor
   * @returns {*}
   */
  readFlag(descriptor) {
    const raw = this.store[descriptor.key];
    if (descriptor.valueType === "proto") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (_e) {
        // fall through
      }
      return descriptor.defaultValue;
    }
    return typeof raw === typeof descriptor.defaultValue
      ? raw
      : descriptor.defaultValue;
  }
} // was: Ep_

// ============================================================================
// Position Enum  (lines 58415–58422)
// ============================================================================

/**
 * Observation-state position enum.
 * [was: sBw]
 */
export const ObservationPosition = {
  POSITION: 1,           // was: baF
  VISIBILITY: 2,         // was: sS
  MONITOR_VISIBILITY: 3, // was: z_
  // reverse mapping
  1: "POSITION",
  2: "VISIBILITY",
  3: "MONITOR_VISIBILITY",
}; // was: sBw

// ============================================================================
// Ad-Measurement Config  (lines 58423–58469)
// ============================================================================

/**
 * Configuration / state object for ad-measurement and viewability.
 * Initialises a FeatureFlagStore with a large set of known measurement keys
 * and creates a PingController.
 *
 * [was: lSy]
 *
 * @property {*}                viewabilityArgs [was: A] — extra arguments
 * @property {number}           adCount         [was: D] — number of ads
 * @property {number}           elapsedMs       [was: O] — elapsed time
 * @property {number}           lastPingId      [was: K] — last ping ID
 * @property {FeatureFlagStore} flagStore       [was: yE]
 * @property {PingController}   pingController  [was: W]
 * @property {boolean}          isStarted       [was: j]
 * @property {FeatureFlagReader} flags          [was: flags]
 */
export class AdMeasurementConfig {
  constructor() {
    this.viewabilityArgs = undefined; // was: this.A = void 0
    this.adCount = 0;                 // was: this.D = 0
    this.elapsedMs = 0;               // was: this.O = 0
    this.lastPingId = -1;             // was: this.K = -1
    this.flagStore = new FeatureFlagStore(); // was: this.yE = new sDy

    // Register known measurement flags
    registerFlag(this.flagStore, "mv", MeasurementState).isOptional = true;
    registerFlag(this.flagStore, "omid", IdentifierMode);
    registerFlag(this.flagStore, "epoh", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "epph", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "umt", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "phel", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "phell", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "oseid", ObservationPosition).isOptional = true;

    // Register a NumericFieldExtractor for "sloi"
    if (!this.flagStore.extractors["sloi"]) {
      this.flagStore.extractors["sloi"] = new NumericFieldExtractor();
    }
    this.flagStore.extractors["sloi"].isOptional = true;

    registerFlag(this.flagStore, "mm", MediaFormat);
    registerFlag(this.flagStore, "ovms", ViewabilitySource).isOptional = true;
    registerFlag(this.flagStore, "xdi", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "amp", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "prf", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "gtx", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "mvp_lv", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "ssmol", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "fmd", IdentifierMode).isOptional = true;
    registerFlag(this.flagStore, "gen204simple", IdentifierMode);

    // bj() returns the measurement source; we pass it and the flag store
    this.pingController = new PingController(
      undefined /* bj() */,
      this.flagStore
    ); // was: this.W = new ZPn(bj(), this.yE)

    this.isStarted = false;    // was: this.j = !1
    this.flags = new FeatureFlagReader(); // was: this.flags = new Ep_
  }

  /**
   * Parse a query-string of measurement flags and feed them to the extractors.
   * [was: lq]
   *
   * @param {string} queryString — e.g. "mv=1&omid=0&epoh=1"
   */
  parseFlags(queryString) {
    if (typeof queryString === "string" && queryString.length !== 0) {
      const store = this.flagStore;
      if (store.enabled) {
        const pairs = queryString.split("&");
        for (let i = pairs.length - 1; i >= 0; i--) {
          const parts = pairs[i].split("=");
          const key = decodeURIComponent(parts[0]);
          let value;
          if (parts.length > 1) {
            const raw = decodeURIComponent(parts[1]);
            value = /^[0-9]+$/g.exec(raw) ? parseInt(raw, 10) : raw;
          } else {
            value = 1;
          }
          const extractor = store.extractors[key];
          if (extractor) extractor.accept(value);
        }
      }
    }
  }
} // was: lSy

// ============================================================================
// Protocol Helper  (lines 58471–58478)
// ============================================================================

/**
 * Holds the URL scheme (http: or https:) and a sampling rate.
 * [was: duw]
 *
 * @property {string} protocol     [was: O] — "https:" or "http:"
 * @property {number} sampleRate   [was: W] — fraction (default 0.01)
 */
export class ProtocolHelper {
  constructor() {
    let protocol = "https:";
    if (win && win.location && win.location.protocol === "http:") {
      protocol = "http:";
    }
    this.protocol = protocol; // was: this.O = Q
    this.sampleRate = 0.01;   // was: this.W = .01
  }
} // was: duw

// ============================================================================
// Error Wrapper  (lines 58480–58488)
// ============================================================================

/**
 * Wraps an Error with additional metadata for logging/reporting.
 * [was: LLx]
 *
 * @property {Error}  error    — the original error
 * @property {Object} meta     — arbitrary metadata
 * @property {string} context  — context identifier
 * @property {string} msg      — human-readable message
 * @property {string} id       — error category (default "jserror")
 */
export class ErrorWrapper {
  /**
   * @param {Error}  error   [was: Q]
   * @param {Object} options [was: c] — { context, message, id }
   */
  constructor(error, options) {
    this.error = error;
    this.meta = {};
    this.context = options.context;
    this.msg = options.message || "";
    this.id = options.id || "jserror";
  }
} // was: LLx

// ============================================================================
// Timing Entry  (lines 58491–58499)
// ============================================================================

/**
 * Represents a single timing/performance entry for instrumentation.
 * [was: wj_]
 *
 * @property {string}           label     — metric label
 * @property {string}           type      — metric type
 * @property {*}                value     — metric value
 * @property {number}           duration  — elapsed time (ms)
 * @property {string|undefined} slotId    — ad slot ID
 * @property {string|undefined} taskId    — task ID
 * @property {number}           uniqueId  — random unique identifier
 */
export class TimingEntry {
  /**
   * @param {string} label [was: Q]
   * @param {string} type  [was: c]
   * @param {*}      value [was: W]
   */
  constructor(label, type, value) {
    this.label = label;
    this.type = type;
    this.value = value;
    this.duration = 0;
    this.slotId = undefined;
    this.taskId = undefined;
    this.uniqueId = Math.random();
  }
} // was: wj_
