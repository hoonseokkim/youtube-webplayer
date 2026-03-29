/**
 * Protobuf message definitions tail, field descriptor setups,
 * ad-viewability measurement classes, error/timing reporting.
 *
 * Source: base.js lines 58321–59120
 * [was: iPm, S4W, yG, FLd, ZPn, Ep_, lSy, duw, LLx, wj_, jBy, fj, Y6,
 *  gpO, l70, w9, OW, kyd, wM, OPx, fBd, c5, Hs, Rom, U$d, ln, p9w, vpn,
 *  pK, aBm, QW, Gex, n4, Wpw, Kpy, VSK, D5, m$m]
 */


import { Size } from "../core/math-utils.js"; // was: g.JP
import { globalRef } from "../core/polyfills.js"; // was: g.qX
import { forEach, remove, contains } from "../core/array-utils.js"; // was: g.lw, g.o0, g.c9
import { forEachObject } from "../core/object-utils.js"; // was: g.ZS
import { parseUri, getDomain } from "../core/url-utils.js"; // was: g.qN, g.D9
import { CONSTRUCTOR_GUARD } from './messages-core.js'; // was: hd
import { TypeDescriptorBase } from './messages-core.js'; // was: RW0
import { EXTENSION_GUARD } from './messages-core.js'; // was: xJ
import { ProtobufMessage } from './message-setup.js'; // was: Zd
import { SYM_SKIP } from './message-setup.js'; // was: sS
import { win } from './messages-core.js'; // was: bI
import { isNumber } from './messages-core.js'; // was: n3
import { reportTelemetry } from '../ads/dai-cue-range.js'; // was: PB
import { ScheduledAdEvent } from '../ads/ad-trigger-types.js'; // was: qr
import { stringReader } from './message-setup.js'; // was: ut
import { isSafariVersioned } from '../core/composition-helpers.js'; // was: wL
import { getLayerStack } from '../ads/ad-async.js'; // was: Jl
import { bannerImageLayoutViewModel } from '../core/misc-helpers.js'; // was: JS
import { isTvUnplugged } from '../data/performance-profiling.js'; // was: Zm
import { buildAuthorizationHeader } from '../core/event-system.js'; // was: WO
import { computeAdSchedulingState } from '../media/source-buffer.js'; // was: AS
import { getClientName } from '../data/performance-profiling.js'; // was: cU
import { isHighQualityNonSurround } from '../ads/ad-click-tracking.js'; // was: TD
import { createNamedSignal } from '../core/bitstream-helpers.js'; // was: kF
import { updateLayout } from '../modules/endscreen/autoplay-countdown.js'; // was: qk
import { isWithinCurrentChunk } from '../data/collection-utils.js'; // was: zr
import { OBSERVATION_RECORD_FIELDS } from './messages-media.js'; // was: Cd
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { dispose } from '../ads/dai-cue-range.js';
import { toString } from '../core/string-utils.js';
import { concat } from '../core/array-utils.js';

// ---------------------------------------------------------------------------
// Protobuf encoding tail (lines 58321–58341)
// ---------------------------------------------------------------------------

/*
 * Tail of a fixed32 encoder: pushes 4 LE bytes after encoding the tag.
 * (Continuation from previous section; closing of the encoder callback.)
 */
// ... encoder callback continuation omitted (inline closure, no standalone symbol)

/**
 * Global registry of proto message types (typeName -> descriptor).
 * [was: Na7]
 */
export const protoMessageRegistry = new Map(); // was: Na7

/**
 * Proto message descriptor class.
 * [was: iPm]
 */
export class ProtoMessageDescriptor extends TypeDescriptorBase { // was: iPm extends RW0
  /**
   * @param {string} typeName  [was: Q]
   * @param {*} fields  [was: c]
   */
  constructor(typeName, fields) {
    super();
    this.typeName = typeName;
    this.W = fields;
    if (CONSTRUCTOR_GUARD !== CONSTRUCTOR_GUARD) throw Error();
    protoMessageRegistry.set(typeName, this); // was: Na7.set(Q, this)
  }
}

// ---------------------------------------------------------------------------
// Field descriptor (lines 58343–58355)
// ---------------------------------------------------------------------------

/**
 * Single-field descriptor with type info and default value.
 * [was: S4W]
 */
export class FieldDescriptor { // was: S4W
  /**
   * @param {*} fieldDef  [was: Q]
   */
  constructor(fieldDef) {
    const meta = yU7; // was: c
    this.W = fieldDef;
    this.isRepeated = 0;
    this.O = W_;
    this.defaultValue = undefined; // was: void 0
    this.A = meta.messageId != null ? EXTENSION_GUARD : undefined; // was: void 0
  }

  register() {
    vb(this);
  }
}

// ---------------------------------------------------------------------------
// yG message class + decode table (lines 58357–58380)
// ---------------------------------------------------------------------------

/**
 * A concrete proto message type extending Zd.
 * [was: yG]
 */
export class YGMessage extends ProtobufMessage { // was: yG
  constructor(data) { // was: Q
    super(data);
  }
}

/**
 * Decode table for YGMessage: field 1 (varint), field 2 (length-delimited string),
 * field 4 (varint).
 */
YGMessage.prototype.O = Kj([
  0,
  Pk(function (reader, msg, fieldNum) { // was: Q, c, W
    if (reader.O !== 1) return false; // was: !1
    const value = LV(reader.W); // was: Q
    C0(msg, fieldNum, value === 0 ? undefined : value); // was: void 0
    return true; // was: !0
  }, JQ, vX),
  Pk(function (reader, msg, fieldNum) { // was: Q, c, W
    if (reader.O !== 0) {
      return false; // was: c = !1
    }
    const str = S0(reader.W, ZY); // was: Q
    C0(msg, fieldNum, str === rUw ? undefined : str); // was: void 0
    return true; // was: c = !0
  }, R$, OR),
  -2,
  Pk(function (reader, msg, fieldNum) { // was: Q, c, W
    if (reader.O !== 0) return false; // was: !1
    const value = ZZ(reader.W); // was: Q
    C0(msg, fieldNum, value === 0 ? undefined : value); // was: void 0
    return true; // was: !0
  }, kl, gS),
]);

// ---------------------------------------------------------------------------
// Flag / settings reader (lines 58381–58469)
// ---------------------------------------------------------------------------

/**
 * Internal cursor for reading protobuf-like flag data.
 * [was: FLd]
 */
export class FlagCursor { // was: FLd
  constructor(data) { // was: Q
    this.A = data;
    this.W = -1;
    this.O = this.j = 0;
  }
}

/**
 * Reader that pairs a data source with a settings registry.
 * [was: ZPn]
 */
export class FlagReader { // was: ZPn
  constructor(data, settings) { // was: Q, c
    this.O = data;
    this.A = settings;
    this.W = new FlagCursor(data);
  }
}

/**
 * In-memory settings store backed by a plain object.
 * [was: Ep_]
 */
export class InMemorySettings { // was: Ep_
  constructor() {
    this.W = {};
  }

  /**
   * Read a value by key descriptor, falling back to defaultValue.
   * [was: BA]
   * @param {Object} descriptor  [was: Q]
   * @returns {*}
   */
  BA(descriptor) {
    const raw = this.W[descriptor.key]; // was: c
    if (descriptor.valueType === "proto") {
      try {
        const parsed = JSON.parse(raw); // was: W
        if (Array.isArray(parsed)) return parsed;
      } catch (_err) {} // was: W
      return descriptor.defaultValue;
    }
    return typeof raw === typeof descriptor.defaultValue ? raw : descriptor.defaultValue;
  }
}

// ---------------------------------------------------------------------------
// Enum: position/visibility monitor (lines 58415–58422)
// ---------------------------------------------------------------------------

/**
 * Measurement-strategy enum.
 * [was: sBw]
 */
export const MeasurementStrategy = {
  baF: 1,       // POSITION
  SYM_SKIP: 2,        // VISIBILITY
  z_: 3,        // MONITOR_VISIBILITY
  1: "POSITION",
  2: "VISIBILITY",
  3: "MONITOR_VISIBILITY",
};

// ---------------------------------------------------------------------------
// Viewability settings / state manager (lines 58423–58469)
// ---------------------------------------------------------------------------

/**
 * Viewability-settings state manager, registers measurement flags.
 * [was: lSy]
 */
export class ViewabilitySettings { // was: lSy
  constructor() {
    this.A = undefined; // was: void 0
    this.O = this.D = 0;
    this.K = -1;
    this.yE = new sDy();
    R0(this.yE, "mv", ZK3).W = true; // was: !0
    R0(this.yE, "omid", Zh);
    R0(this.yE, "epoh", Zh).W = true;
    R0(this.yE, "epph", Zh).W = true;
    R0(this.yE, "umt", Zh).W = true;
    R0(this.yE, "phel", Zh).W = true;
    R0(this.yE, "phell", Zh).W = true;
    R0(this.yE, "oseid", MeasurementStrategy).W = true; // was: sBw
    const settings = this.yE; // was: Q
    if (!settings.W.sloi) settings.W.sloi = new E6y();
    settings.W.sloi.W = true;
    R0(this.yE, "mm", FA);
    R0(this.yE, "ovms", SR7).W = true;
    R0(this.yE, "xdi", Zh).W = true;
    R0(this.yE, "amp", Zh).W = true;
    R0(this.yE, "prf", Zh).W = true;
    R0(this.yE, "gtx", Zh).W = true;
    R0(this.yE, "mvp_lv", Zh).W = true;
    R0(this.yE, "ssmol", Zh).W = true;
    R0(this.yE, "fmd", Zh).W = true;
    R0(this.yE, "gen204simple", Zh);
    this.W = new FlagReader(bj(), this.yE); // was: ZPn
    this.j = false; // was: !1
    this.flags = new InMemorySettings(); // was: Ep_
  }

  /**
   * Parse a query-string of flags and apply them to the settings registry.
   * [was: lq]
   * @param {string} queryString  [was: Q]
   */
  lq(queryString) {
    if (typeof queryString === "string" && queryString.length !== 0) {
      const settings = this.yE; // was: c
      if (settings.O) {
        const pairs = queryString.split("&"); // was: Q
        for (let i = pairs.length - 1; i >= 0; i--) { // was: K
          const kv = pairs[i].split("="); // was: W
          let key = decodeURIComponent(kv[0]); // was: m
          let value; // was: W
          if (kv.length > 1) {
            value = decodeURIComponent(kv[1]);
            value = /^[0-9]+$/g.exec(value) ? parseInt(value, 10) : value;
          } else {
            value = 1;
          }
          const flag = settings.W[key]; // was: m
          if (flag) flag.A(value);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Reporting / error infrastructure (lines 58471–58665)
// ---------------------------------------------------------------------------

/**
 * Protocol/transport configuration (scheme + sample rate).
 * [was: duw]
 */
export class TransportConfig { // was: duw
  constructor() {
    let protocol = "https:"; // was: Q
    if (win && win.location && win.location.protocol === "http:") {
      protocol = "http:";
    }
    this.O = protocol;
    this.W = 0.01;
  }
}

/**
 * Error wrapper with context/metadata.
 * [was: LLx]
 */
export class ErrorWrapper { // was: LLx
  /**
   * @param {Error} error  [was: Q]
   * @param {Object} context  [was: c]
   */
  constructor(error, context) {
    this.error = error;
    this.meta = {};
    this.context = context.context;
    this.msg = context.message || "";
    this.id = context.id || "jserror";
  }
}

/**
 * Cached debug-ID extracted from the URL hash.
 */
let debugId = null; // was: k6

/**
 * Timing entry for performance measurement.
 * [was: wj_]
 */
export class TimingEntry { // was: wj_
  /**
   * @param {string} label  [was: Q]
   * @param {string} type  [was: c]
   * @param {number} value  [was: W]
   */
  constructor(label, type, value) {
    this.label = label;
    this.type = type;
    this.value = value;
    this.duration = 0;
    this.taskId = this.slotId = undefined; // was: void 0
    this.uniqueId = Math.random();
  }
}

/**
 * Performance-timing globals.
 */
const perfApi = globalRef.performance; // was: eb
const hasUserTiming = !!(perfApi && perfApi.mark && perfApi.measure && perfApi.clearMarks); // was: bPm
const isTimingEnabled = a_(() => { // was: Vz
  let enabled; // was: Q
  if (!hasUserTiming) return false;
  let match; // was: c
  const win = window; // was: Q
  if (debugId === null) {
    debugId = "";
    try {
      let hash = ""; // was: W
      try {
        hash = win.top.location.hash;
      } catch (_err) { // was: m
        hash = win.location.hash;
      }
      if (hash) {
        debugId = (match = hash.match(/\bdeid=([\d,]+)/)) ? match[1] : "";
      }
    } catch (_err) {} // was: W
  }
  match = debugId;
  return !!match.indexOf && match.indexOf("1337") >= 0;
});

// ---------------------------------------------------------------------------
// URL parsing helpers (lines 58527–58529)
// ---------------------------------------------------------------------------

/**
 * Full URI regex.
 * [was: uin]
 */
export const URI_REGEX = RegExp(
  "^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$"
);

/**
 * Fragment / end-of-string anchor.
 * [was: ws]
 */
export const FRAGMENT_OR_END = /#|$/;

/**
 * Trailing empty query-param cleaner.
 * [was: CD0]
 */
export const TRAILING_EMPTY_PARAM = /[?&]($|#)/;

// ---------------------------------------------------------------------------
// Error reporter (lines 58530–58668)
// ---------------------------------------------------------------------------

/**
 * JS error reporter that sends structured error beacons.
 * [was: jBy]
 */
export class ErrorReporter { // was: jBy
  /**
   * @param {Object|null} timingQueue  [was: Q]
   */
  constructor(timingQueue = null) {
    this.W = i8;
    this.Q8 = "jserror";
    this.H6 = true; // was: !0
    this.zG = null;
    this.O = this.Iy;
    this.ot = timingQueue;
  }

  /**
   * Report a JS error with context.
   * [was: Iy]
   */
  Iy(contextId, errorObj, sampleRate, metaAugmenter, category) { // was: Q, c, W, m, K
    category = category || this.Q8;
    let topInfo; // was: T
    try {
      const payload = new UJ(); // was: V
      let p = payload; // was: r
      p.W.push(1);
      p.O[1] = ZO("context", contextId);

      if (!(errorObj.error && errorObj.meta && errorObj.id)) {
        errorObj = new SimpleError(OJ(errorObj)); // was: fj
      }
      p = errorObj;
      if (p.msg) {
        const truncated = p.msg.substring(0, 512); // was: U
        payload.W.push(2);
        payload.O[2] = ZO("msg", truncated);
      }

      let meta = p.meta || {}; // was: I -> U
      if (this.zG) {
        try { this.zG(meta); } catch (_err) {} // was: B
      }
      if (metaAugmenter) {
        try { metaAugmenter(meta); } catch (_err) {}
      }

      payload.W.push(3);
      payload.O[3] = [meta];

      topInfo = Se(); // was: T
      if (topInfo.O) {
        const topUrl = topInfo.O.url || ""; // was: X
        payload.W.push(4);
        payload.O[4] = ZO("top", topUrl);
      }

      const pageInfo = { url: topInfo.W.url || "" }; // was: A
      let origin; // was: e
      if (topInfo.W.url) {
        const parsed = parseUri(topInfo.W.url); // was: B
        origin = x8(parsed[1], null, parsed[3], parsed[4]);
      } else {
        origin = "";
      }
      payload.W.push(5);
      payload.O[5] = [pageInfo, { url: origin }];

      Ik(this.W, category, payload, sampleRate);
    } catch (err) { // was: V
      try {
        Ik(this.W, category, {
          context: "ecmserr",
          rctx: contextId,
          msg: OJ(err),
          url: topInfo && topInfo.W.url,
        }, sampleRate);
      } catch (_err) {} // was: B
    }
    return this.H6;
  }
}

/**
 * Simple error wrapper that creates an Error from a message string.
 * [was: fj]
 */
export class SimpleError extends ErrorWrapper { // was: fj extends LLx
  constructor(message) { // was: Q
    super(Error(message), { message });
  }
}

// ---------------------------------------------------------------------------
// Timing queue singleton (lines 58612–58668)
// ---------------------------------------------------------------------------

let transportConfig; // was: i8
let errorReporter; // was: ak

/**
 * Timing/measurement queue (singleton).
 * [was: Y6]
 */
export const timingQueue = new (class { // was: Y6
  constructor(sampleRate, win) { // was: Q, c
    this.events = [];
    this.O = win || globalRef;
    let externalFlag = null; // was: W
    if (win) {
      win.google_js_reporting_queue = win.google_js_reporting_queue || [];
      this.events = win.google_js_reporting_queue;
      externalFlag = win.google_measure_js_timing;
    }
    this.W = isTimingEnabled() || (externalFlag != null ? externalFlag : Math.random() < sampleRate);
  }

  disable() {
    this.W = false; // was: !1
    if (this.events !== this.O.google_js_reporting_queue) {
      if (isTimingEnabled()) forEach(this.events, Bh);
      this.events.length = 0;
    }
  }

  start(label, type) { // was: Q, c
    if (!this.W) return null;
    const now = AF() || XS(); // was: W
    const entry = new TimingEntry(label, type, now); // was: Q
    const markName = `goog_${entry.label}_${entry.uniqueId}_start`; // was: c
    if (perfApi && isTimingEnabled()) perfApi.mark(markName);
    return entry;
  }

  end(entry) { // was: Q
    if (this.W && isNumber(entry.value)) {
      const now = AF() || XS(); // was: c
      entry.duration = now - entry.value;
      const markName = `goog_${entry.label}_${entry.uniqueId}_end`; // was: c
      if (perfApi && isTimingEnabled()) perfApi.mark(markName);
      if (!this.W || this.events.length > 2048) return;
      this.events.push(entry);
    }
  }
})(1, window);

const checkTimingState = () => { // was: gpO
  if (win && typeof win.google_measure_js_timing !== "undefined") {
    if (!win.google_measure_js_timing) timingQueue.disable();
  }
};

transportConfig = new TransportConfig(); // was: i8 = new duw
errorReporter = new ErrorReporter(timingQueue); // was: ak = new jBy(Y6)

if (win && win.document) {
  if (win.document.readyState === "complete") {
    checkTimingState();
  } else if (timingQueue.W) {
    qf(win, "load", () => { checkTimingState(); });
  }
}

/**
 * Register meta-augmenter callbacks on the error reporter.
 * [was: l70]
 */
export const setMetaAugmenters = (callbacks) => { // was: l70, Q
  errorReporter.zG = (meta) => { // was: c
    forEach(callbacks, (cb) => cb(meta)); // was: W
  };
};

/**
 * Wrap a callback through the error reporter.
 * [was: w9]
 */
export const wrapWithReporter = (contextId, callback) => vh(errorReporter, contextId, callback); // was: w9

/**
 * Wrap for OW-style reporting.
 * [was: OW]
 */
export const wrapForOW = (contextId, callback) => Gd(contextId, callback); // was: OW

/**
 * Report a specific error (context 538) at 1% sample rate.
 * [was: kyd]
 */
export const reportError538 = (error, metaAugmenter) => { // was: kyd
  errorReporter.Iy(538, error, 0.01, metaAugmenter);
};

// ---------------------------------------------------------------------------
// Ad-viewability measurement classes (lines 58670–59120)
// ---------------------------------------------------------------------------

export const adTimingStart = Date.now(); // was: Ph
let currentTime = -1; // was: u_
let previousTime = -1; // was: $8
let p4Ref; // was: p4
let heartbeatTime = -1; // was: hF
let isLive = false; // was: l_ -> !1

/**
 * Measurement sample at a point in time.
 * [was: wM]
 */
export class MeasurementSample { // was: wM
  constructor(time, isAudible, owner) { // was: Q, c, W
    this.time = time;
    this.volume = null;
    this.A = isAudible;
    this.W = new reportTelemetry(0, 0, 0, 0); // was: m
    this.O = owner;
  }

  equals(other, checkVolume = false) { // was: Q, c -> !1
    return !!other &&
      (!checkVolume || this.volume === other.volume) &&
      this.A === other.A &&
      uI(this.W, other.W) &&
      true; // was: !0
  }
}

/**
 * Full viewability state snapshot.
 * [was: OPx]
 */
export class ViewabilityState { // was: OPx
  constructor(sample, element, bounds, padding, width, height, elapsed, extra) { // was: Q–U
    this.j = sample;
    this.J = element;
    this.A = bounds;
    this.D = padding;
    this.W = width;
    this.K = height;
    this.O = elapsed;
    this.L = extra;
  }

  Ae() {
    return this.J;
  }

  equals(other, checkVolume = false) { // was: Q, c -> !1
    return this.j.equals(other.j, checkVolume) &&
      this.J === other.J &&
      uI(this.A, other.A) &&
      uI(this.D, other.D) &&
      this.W === other.W &&
      this.K === other.K &&
      this.O === other.O &&
      this.L === other.L;
  }
}

/**
 * Bitmask constants for viewability data fields.
 * [was: fBd]
 */
export const ViewabilityFields = {
  currentTime: 1,
  duration: 2,
  isVpaid: 4,
  volume: 8,
  isYouTube: 16,
  isPlaying: 32,
};

/**
 * VAST event-name constants.
 * [was: c5]
 */
export const VastEvents = {
  ScheduledAdEvent: "start",
  lA: "firstquartile",
  aB: "midpoint",
  stringReader: "thirdquartile",
  COMPLETE: "complete",
  ERROR: "error",
  isSafariVersioned: "metric",
  PAUSE: "pause",
  yy: "resume",
  US: "skip",
  getLayerStack: "viewable_impression",
  zp: "mute",
  kz: "unmute",
  sb: "fullscreen",
  bannerImageLayoutViewModel: "exitfullscreen",
  uA: "bufferstart",
  qa: "bufferfinish",
  isTvUnplugged: "fully_viewable_audible_half_duration_impression",
  buildAuthorizationHeader: "measurable_impression",
  computeAdSchedulingState: "abandon",
  HU: "engagedview",
  getClientName: "impression",
  X8: "creativeview",
  LOADED: "loaded",
  fFM: "progress",
  CLOSE: "close",
  isHighQualityNonSurround: "collapse",
  Lj: "overlay_resize",
  B_: "overlay_unmeasurable_impression",
  G_: "overlay_unviewable_impression",
  Ne: "overlay_viewable_immediate_impression",
  v_: "overlay_viewable_end_of_session_impression",
  createNamedSignal: "custom_metric_viewable",
  Qk: "audio_audible",
  CG: "audio_measurable",
  KG: "audio_impression",
};

export const PROGRESS_EVENTS = "start firstquartile midpoint thirdquartile resume loaded".split(" "); // was: BO0
export const QUARTILE_EVENTS = ["start", "firstquartile", "midpoint", "thirdquartile"]; // was: EN
export const ABANDON_EVENTS = ["abandon"]; // was: i9w

/**
 * VAST event-name to numeric ID mapping.
 * [was: Hs]
 */
export const VastEventIds = {
  UNKNOWN: -1,
  ScheduledAdEvent: 0,
  lA: 1,
  aB: 2,
  stringReader: 3,
  COMPLETE: 4,
  isSafariVersioned: 5,
  PAUSE: 6,
  yy: 7,
  US: 8,
  getLayerStack: 9,
  zp: 10,
  kz: 11,
  sb: 12,
  bannerImageLayoutViewModel: 13,
  isTvUnplugged: 14,
  buildAuthorizationHeader: 15,
  computeAdSchedulingState: 16,
  HU: 17,
  getClientName: 18,
  X8: 19,
  LOADED: 20,
  createNamedSignal: 21,
  uA: 22,
  qa: 23,
  KG: 27,
  CG: 28,
  Qk: 29,
};

/**
 * MRAID API method names.
 * [was: Rom]
 */
export const MraidMethods = {
  updateLayout: "addEventListener",
  Iz: "getMaxSize",
  isWithinCurrentChunk: "getScreenSize",
  On: "getState",
  jL: "getVersion",
  Ha0: "removeEventListener",
  hM: "isViewable",
};

/**
 * Check if elementFromPoint is available.
 * [was: U$d]
 * @returns {boolean}
 */
export const isElementFromPointAvailable = () => {
  const doc = window.document; // was: Q
  return doc && typeof doc.elementFromPoint === "function";
};

/**
 * Floor a number to N decimal places.
 * [was: ln]
 */
export const floorToDecimals = (value, decimals) => { // was: Q, c
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
};

/**
 * Environment info for viewability: cross-origin, mobile, domain, viewport.
 * [was: p9w]
 */
export class EnvironmentInfo { // was: p9w
  constructor() {
    this.A = !DO(win.top); // cross-origin
    this.isMobileDevice = HS() || Nf();
    const frames = y6(); // was: Q
    this.domain = frames.length > 0 && frames[frames.length - 1] != null && frames[frames.length - 1].url != null
      ? getDomain(frames[frames.length - 1].url) || ""
      : "";
    this.W = new reportTelemetry(0, 0, 0, 0);
    this.j = new Size(0, 0); // was: new g.JP(0, 0)
    this.K = new Size(0, 0); // was: new g.JP(0, 0)
    this.J = new reportTelemetry(0, 0, 0, 0);
    this.frameOffset = new g.zY(0, 0); 
    this.D = 0;
    this.L = false; // was: !1
    this.O = !(!win || !zd(win).OBSERVATION_RECORD_FIELDS);
    this.update(win);
  }

  update(win) { // was: Q
    if (win && win.document) {
      this.J = MN(false, win, this.isMobileDevice); // was: !1
      this.W = MN(true, win, this.isMobileDevice); // was: !0
      Qs(this, win);
      pj(this, win);
    }
  }
}

/**
 * Scheduled sampler that invokes a callback on a timer.
 * [was: vpn]
 */
export class ScheduledSampler { // was: vpn
  constructor(target) { // was: Q
    this.A = target;
    this.O = 0;
    this.W = null;
  }

  cancel() {
    bj().clearTimeout(this.W);
    this.W = null;
  }

  schedule() {
    const global = bj(); // was: Q
    const reporterFn = rs().W.W; // was: c
    this.W = global.setTimeout(
      ok(reporterFn, wrapForOW(143, () => { // was: OW
        this.O++;
        this.A.sample();
      })),
      JH0()
    );
  }
}

/**
 * Base measurement client for viewability tracking.
 * [was: pK]
 */
export class MeasurementClient { // was: pK
  constructor(window, sampleRate, name = "na") { // was: Q, c, W
    this.A = window;
    this.toggleFineScrub = name;
    this.K = [];
    this.isInitialized = false; // was: !1
    this.j = new MeasurementSample(-1, true, this); // was: !0
    this.W = this;
    this.S = sampleRate;
    this.MM = this.isSamsungSmartTV = false; // was: !1
    this.parseHexColor = "uk";
    this.PA = false; // was: !1
    this.J = true; // was: !0
  }

  T2() { return false; } // was: !1
  initialize() { return (this.isInitialized = true); } // was: !0
  Y() { return this.W.parseHexColor; }
  Ie() { return this.W.MM; }

  fail(reason, force = false) { // was: Q, c -> !1
    if (!this.MM || force) {
      this.MM = true; // was: !0
      this.parseHexColor = reason;
      this.S = 0;
      if (this.W === this) TR(this);
    }
  }

  getName() { return this.W.toggleFineScrub; }
  G0() { return this.W.JJ(); }
  JJ() { return {}; }
  oM() { return this.W.S; }

  UH() {
    const env = Y8(); // was: Q
    env.W = MN(true, this.A, env.isMobileDevice); // was: !0
  }

  XI() { pj(Y8(), this.A); }
  La() { return this.j.W; }
  sample() {}
  isActive() { return this.W.J; }

  mF(other) { // was: Q
    const prev = this.W; // was: c
    this.W = other.oM() >= this.S ? other : this;
    if (prev !== this.W) {
      this.J = this.W.J;
      TR(this);
    } else if (this.J !== this.W.J) {
      this.J = this.W.J;
      TR(this);
    }
  }

  D(sample) { // was: Q
    if (sample.O === this.W) {
      const changed = !this.j.equals(sample, this.isSamsungSmartTV); // was: c
      this.j = sample;
      if (changed) K4(this);
    }
  }

  Rw() { return this.isSamsungSmartTV; }
  dispose() { this.PA = true; } // was: !0
  u0() { return this.PA; }
}

/**
 * Per-element viewability observer.
 * [was: aBm]
 */
export class ElementObserver { // was: aBm
  constructor(element, client, settings, trackVolume) { // was: Q, c, W, m
    this.element = element;
    this.W = new reportTelemetry(0, 0, 0, 0);
    this.A = null;
    this.S = new reportTelemetry(0, 0, 0, 0);
    this.O = client;
    this.yE = settings;
    this.La = trackVolume;
    this.UH = false; // was: !1
    this.timestamp = -1;
    this.Ka = new ViewabilityState(
      client.j, this.element, this.W, new reportTelemetry(0, 0, 0, 0), 0, 0, Date.now() - adTimingStart, 0
    );
    this.L = undefined; // was: void 0
  }

  observe() { return true; } // was: !0
  unobserve() {}
  J(callback) { this.L = callback; } // was: Q

  dispose() {
    if (!this.u0()) {
      remove(this.O.K, this);
      if (this.O.isSamsungSmartTV && this.Rw()) r9(this.O);
      this.unobserve();
      this.UH = true; // was: !0
    }
  }

  u0() { return this.UH; }
  G0() { return this.O.G0(); }
  oM() { return this.O.oM(); }
  Y() { return this.O.Y(); }
  Ie() { return this.O.Ie(); }
  mF() {}
  D() { this.K(); }
  Rw() { return this.La; }
}

/**
 * Higher-level viewability manager wrapping a MeasurementClient.
 * [was: QW]
 */
export class ViewabilityManager { // was: QW
  constructor(client) { // was: Q
    this.L = false; // was: !1
    this.W = client;
    this.J = () => {};
  }

  oM() { return this.W.oM(); }
  Y() { return this.W.Y(); }
  Ie() { return this.W.Ie(); }

  create(element, settings, trackVolume) { // was: Q, c, W
    let observer = null; // was: m
    if (this.W) {
      observer = this.j(element, settings, trackVolume);
      ow(this.W, observer);
    }
    return observer;
  }

  S() { return this.A(); }
  A() { return false; } // was: !1

  init(failCallback) { // was: Q
    if (!this.W.initialize()) return false;
    ow(this.W, this);
    this.J = failCallback;
    return true; // was: !0
  }

  mF(source) { // was: Q
    if (source.oM() === 0) this.J(source.Y(), this);
  }

  D() {}
  Rw() { return false; } // was: !1
  dispose() { this.L = true; } // was: !0
  u0() { return this.L; }
  G0() { return {}; }
}

// ---------------------------------------------------------------------------
// Gen204 / beacon helpers (lines 59036–59120)
// ---------------------------------------------------------------------------

/**
 * A single entry in a query-parameter builder.
 * [was: Gex]
 */
export class QueryEntry { // was: Gex
  constructor(key, value, priority = 0) { // was: Q, c, W
    this.A = priority;
    this.O = key;
    this.W = value == null ? "" : value;
  }
}

/**
 * Ordered collection of query parameters with priority.
 * [was: n4]
 */
export class QueryParamBuilder { // was: n4
  constructor() {
    this.A = 0;
    this.W = [];
    this.O = false; // was: !1
  }

  add(key, value, priority) { // was: Q, c, W
    ++this.A;
    const entry = new QueryEntry(key, value, priority); // was: Q
    this.W.push(new QueryEntry(entry.O, entry.W, entry.A + this.A / 4096));
    this.O = true; // was: !0
    return this;
  }
}

/**
 * Serialize a QueryEntry to "key=value" or just "key" form.
 * [was: Wpw]
 */
export const serializeQueryEntry = (entry) => { // was: Wpw, Q
  const key = entry.O; // was: c
  const value = entry.W; // was: Q
  if (value === "") return key;
  if (typeof value === "boolean") return value ? key : "";
  if (Array.isArray(value)) return value.length === 0 ? key : `${key}=${value.join()}`;
  return `${key}=${contains(["mtos", "tos", "p"], key) ? value : encodeURIComponent(value)}`;
};

/**
 * Gen204 beacon URL builder.
 * [was: Kpy]
 */
export class Gen204Builder { // was: Kpy
  constructor(initialEntries) { // was: Q
    this.W = new QueryParamBuilder(); // was: n4
    if (initialEntries !== undefined) cvK(this.W, initialEntries); // was: void 0
    this.W.add("v", "unreleased", -16);
  }

  toString() {
    let url = "//pagead2.googlesyndication.com//pagead/gen_204"; // was: Q
    const serialized = Vs(this.W); // was: c
    if (serialized.length > 0) url += "?" + serialized;
    return url;
  }
}

/**
 * Sort query params into priority buckets for gen204.
 * [was: VSK]
 */
export const sortGen204Params = (params) => { // was: VSK, Q
  const highPriority = []; // was: c
  const lowPriority = []; // was: W
  forEachObject(params, (value, key) => { // was: m, K
    if (key in Object.prototype || typeof value === "undefined") return; // was: void 0
    if (Array.isArray(value)) value = value.join(",");
    const pair = [key, "=", value].join("");
    switch (key) {
      case "adk":
      case "r":
      case "tt":
      case "error":
      case "mtos":
      case "tos":
      case "p":
      case "bs":
        highPriority.unshift(pair);
        break;
      case "req":
      case "url":
      case "referrer":
      case "iframe_loc":
        lowPriority.push(pair);
        break;
      default:
        highPriority.push(pair);
    }
  });
  return highPriority.concat(lowPriority);
};

/**
 * Send a gen204 beacon.
 * [was: D5]
 */
export const sendGen204 = (builder) => { // was: D5, Q
  const url = builder.toString(); // was: Q
  bj();
  wf(url);
};

/**
 * Simple counter.
 * [was: m$m]
 */
export class SimpleCounter { // was: m$m
  constructor() {
    this.W = 0;
  }
}
