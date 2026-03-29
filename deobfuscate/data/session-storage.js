/**
 * session-storage.js -- Storage availability detection, quota management,
 * storage fallback mechanisms, experiment flags, signals framework,
 * animation and timing utilities, and pub/sub system.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 64191-64933
 *
 * Covers:
 *  - GT.prototype.create: Waa/Create RPC binding
 *  - ExperimentFlag classes (Nu, iu, yW): boolean/int/double experiment flags
 *  - Experiment flag declarations (N83 .. zYy, KIR .. BHK)
 *  - Feature wrapper classes (Z_W, EPW)
 *  - Third-party verification URL patterns (Px, te3, Nfy)
 *  - Config proto classes (sy0, do7, iNw, ST0)
 *  - Signals framework (uZ, zT, Jd, Eyx): reactive signal primitives
 *  - NetworkMonitor (pG): online/offline detection with polling
 *  - Proto message classes (LT7, b_W) and wire-format tables
 *  - Proto deserialiser (jy7, wIR)
 *  - BitField (e1W): 52-bit boolean array
 *  - RequestAnimationFrame wrapper (AnimationFrameTimer)
 *  - SingleShotTimer (ThrottleTimer): one-shot setTimeout wrapper
 *  - Throttle (g.F_): throttled function invocation with pause/resume
 *  - MappedIterator (g.gPw): lazy map over an iterator
 *  - Animation base (g.H7): play/pause/stop animation with events
 *  - CSS transition animation (NI): opacity transitions
 *  - Safe CSS values (jaR): allowlist of CSS function names
 *  - DOM property guards (yN, SC, vy_, aOR)
 *  - Bidi detection regexes (lO_, NS_, g.fU7, g.Ec, etc.)
 *  - Lazy iterable classes (dq, L6, wq)
 *  - TimeRange (jC, v7)
 *  - Browser version (hL3)
 *  - PubSub (AsyncQueue): topic-based publish/subscribe
 */

import { AnimationFrameTimer, AsyncQueue, stopAndFire, ThrottleTimer } from '../core/bitstream-helpers.js';  // was: g.T5, g.$K, g.I9, g.Uc
import { EventTargetBase, listen } from '../core/composition-helpers.js';  // was: g.$R, g.s7
import { forEach, scheduleMacroTask } from '../core/event-registration.js';  // was: g.mfm, g.tz
import { globalRef } from '../core/polyfills.js';  // was: g.IW
import { invokeUnaryRpc } from '../media/bitstream-reader.js'; // was: BG
import { getSlotState } from '../ads/ad-scheduling.js'; // was: zA
import { ProtobufMessage } from '../proto/message-setup.js'; // was: Zd
import { SLOT_ARRAY_STATE } from '../proto/messages-core.js'; // was: Xm
import { LISTENABLE_KEY } from './event-logging.js'; // was: NH
import { SlotIdFulfilledNonEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: FD
import { probeNetworkStatus } from '../core/bitstream-helpers.js'; // was: QN
import { fixed32RawReader } from '../proto/message-setup.js'; // was: HP7
import { int64SignedReader } from '../proto/message-setup.js'; // was: efy
import { getRequestAnimationFrame } from '../core/bitstream-helpers.js'; // was: o9
import { onPresentingVideoDataChange } from '../player/player-events.js'; // was: rq
import { removeListenerKey } from '../core/composition-helpers.js'; // was: vO
import { disposeApp } from '../player/player-events.js'; // was: WA
import { scheduleDebounce } from '../core/bitstream-helpers.js'; // was: Xr
import { getBufferedEnd } from '../media/source-buffer.js'; // was: KA
import { scheduleAsyncCallback } from '../core/bitstream-helpers.js'; // was: zL3
import { dispose } from '../ads/dai-cue-range.js';

import { Disposable } from '../core/disposable.js';
import { remove, slice, clear } from '../core/array-utils.js';
// RESOLVED: g.F_ → ThrottleTimer (exported below)
// RESOLVED: g.GjR → experimentFlag_GjR (exported below)
// RESOLVED: g.H7 → CssAnimation in core/bitstream-helpers.js
// RESOLVED: g.Jc7 → experimentFlag_Jc7 (exported below)
// RESOLVED: g.NXK → experimentFlag_NXK (exported below)
// RESOLVED: g.FT7 → experimentFlag_FT7 (exported below)
// TODO: resolve g.abm
// TODO: resolve g.gPw
// TODO: resolve g.y27

// =========================================================================
// Waa/Create RPC binding   [was: GT.prototype.create, lines 64191-64193]
// =========================================================================

/**
 * Issue a Waa/Create RPC call.
 * [was: GT.prototype.create]
 *
 * @param {*} request [was: Q]
 * @param {Object} [metadata] [was: c]
 * @param {*} [options] [was: W]
 * @returns {*}
 */
GT.prototype.create = function (request, metadata, options) { // was: create(Q, c, W)
  return invokeUnaryRpc(
    this.transport, // was: this.W
    this.baseUrl + "/$rpc/google.internal.waa.v1.Waa/Create", // was: this.O + "/$rpc/..."
    request,
    metadata || {},
    Lw3,
    options
  );
};

// =========================================================================
// Experiment flag types   [was: Nu, iu, yW, lines 64195-64218]
// =========================================================================

/**
 * Boolean experiment flag.
 *
 * [was: Nu]
 */
export class BooleanFlag { // was: Nu
  /**
   * @param {number} experimentId [was: Q]
   * @param {boolean} defaultValue [was: c]
   */
  constructor(experimentId, defaultValue) { // was: constructor(Q, c)
    /** @type {number} Priority / tier [was: this.di] */
    this.tier = 3; // was: this.di = 3

    /** @type {number} Experiment ID [was: this.J8] */
    this.experimentId = experimentId; // was: this.J8 = Q

    /** @type {boolean} [was: this.defaultValue] */
    this.defaultValue = defaultValue;

    /** @type {string} [was: this.j9] */
    this.valueType = "bool"; // was: this.j9 = "bool"
  }
}

/**
 * Integer experiment flag.
 *
 * [was: iu]
 */
export class IntFlag { // was: iu
  /**
   * @param {number} experimentId [was: Q]
   * @param {*} defaultValue [was: c]
   */
  constructor(experimentId, defaultValue) { // was: constructor(Q, c)
    this.tier = 3; // was: this.di = 3
    this.experimentId = experimentId; // was: this.J8 = Q
    this.defaultValue = defaultValue;
    this.valueType = "int"; // was: this.j9 = "int"
  }
}

/**
 * Double/float experiment flag.
 *
 * [was: yW]
 */
export class DoubleFlag { // was: yW
  /**
   * @param {number} experimentId [was: Q]
   * @param {number} defaultValue [was: c]
   */
  constructor(experimentId, defaultValue) { // was: constructor(Q, c)
    this.tier = 3; // was: this.di = 3
    this.experimentId = experimentId; // was: this.J8 = Q
    this.defaultValue = defaultValue;
    this.valueType = "double"; // was: this.j9 = "double"
  }
}

// =========================================================================
// Experiment flag declarations   [was: lines 64220-64308]
// =========================================================================

// Boolean flags -- each `new BooleanFlag(id, default)`
export const N83 = new BooleanFlag(45759580, false);
export const vcm = new BooleanFlag(45766273, false);
g.abm = new BooleanFlag(45766751, false);
export const experimentFlag_GjR = new BooleanFlag(45757878, false); // was: g.GjR
export const NF = new BooleanFlag(45749396, false);
export const kq_ = new BooleanFlag(45751227, false);
export const $07 = new BooleanFlag(45751228, false);
export const LOd = new BooleanFlag(45745123, false);
export const PNd = new BooleanFlag(45742118, false);
export const P4_ = new BooleanFlag(45742119, false);
export const lbm = new BooleanFlag(45754339, false);
export const u47 = new BooleanFlag(45757087, false);
export const hDR = new BooleanFlag(45756446, false);
export const P4 = new BooleanFlag(45758283, false);
export const uCm = new BooleanFlag(45760018, false);
export const zD3 = new BooleanFlag(45739196, false);
export const CNw = new BooleanFlag(45739198, false);
export const MiX = new BooleanFlag(45739197, false);

// Integer flags
export const experimentFlag_Jc7 = new IntFlag(45750947, DY("0")); // was: g.Jc7

// Double flags
export const RDn = new DoubleFlag(45746966, 0);
export const kj_ = new DoubleFlag(45746967, 0);
export const YAR = new DoubleFlag(45737488, 0);
export const pLn = new DoubleFlag(45737489, 0);

// More boolean flags
export const uq7 = new BooleanFlag(45732791, true);
export const Pf = new BooleanFlag(45728572, true);
export const Qyd = new BooleanFlag(45781111, false);
export const DcR = new BooleanFlag(45769119, true);
export const uBy = new BooleanFlag(45737482, false);

export const hnd = new DoubleFlag(45741773, 0);

export const c2d = new BooleanFlag(45763496, false);
export const WTK = new BooleanFlag(45763411, false);
export const moW = new BooleanFlag(45731083, false);
export const Qsm = new BooleanFlag(45728553, false);
export const KTX = new BooleanFlag(45734191, false);
export const Dfm = new BooleanFlag(45745610, false);
export const McW = new BooleanFlag(45756619, false);
export const TX_ = new BooleanFlag(45758290, false);
export const oPn = new BooleanFlag(45762920, false);
export const r2w = new BooleanFlag(45768391, false);
export const vAn = new BooleanFlag(45735523, false);

export const UoX = new DoubleFlag(45735428, 4000);

export const IUO = new BooleanFlag(45748009, false);
export const XMy = new BooleanFlag(45752604, false);

export const A20 = new DoubleFlag(45769214, 0);

export const eO0 = new BooleanFlag(45735462, false);
export const VRn = new BooleanFlag(45751943, false);
export const BX7 = new BooleanFlag(45751944, false);
export const xom = new BooleanFlag(45751945, false);
export const ni7 = new BooleanFlag(45764592, false);

export const qfm = new DoubleFlag(45764593, 0);

export const I23 = new BooleanFlag(45766511, false);
export const nPd = new BooleanFlag(45768698, false);
export const Rh = new BooleanFlag(45728181, false);
export const j1y = new BooleanFlag(45746180, false);
export const lI7 = new BooleanFlag(45756543, false);
export const Dox = new BooleanFlag(45756620, false);

export const tR7 = new IntFlag(45761760, DY("200"));

export const H_d = new BooleanFlag(45740357, false);

export const izm = new IntFlag(45762838, DY("0"));

export const yn0 = new DoubleFlag(45768430, 0);
export const YQn = new BooleanFlag(45768318, false);

export const experimentFlag_NXK = new BooleanFlag(45755760, false); // was: g.NXK

export const DJO = new BooleanFlag(45760017, false);
export const Q40 = new BooleanFlag(45732775, false);
export const i_7 = new BooleanFlag(45765818, false);

g.y27 = new BooleanFlag(45734776, false);

export const Sfn = new BooleanFlag(45760120, false);
export const zYy = new BooleanFlag(45755924, false);

export const experimentFlag_FT7 = new BooleanFlag(45769160, false); // was: g.FT7

// Additional double flag batch
export const KIR = new DoubleFlag(45756872, 0);
export const mYO = new DoubleFlag(45725542, 0);
export const WI_ = new DoubleFlag(45725543, 0);
export const oZK = new DoubleFlag(45757426, 0);
export const p6_ = new DoubleFlag(45725539, 0);
export const rWm = new DoubleFlag(45764252, 0);
export const cWn = new DoubleFlag(45725541, 0);
export const UYK = new DoubleFlag(45757427, 0);
export const Q1O = new DoubleFlag(45725540, 0);
export const YdO = new DoubleFlag(45725538, 0);
export const THR = new DoubleFlag(45764523, 0);
export const I$O = new DoubleFlag(45764217, 0);
export const Xv_ = new DoubleFlag(45764524, 0);
export const etx = new DoubleFlag(45765602, 0);
export const V8m = new DoubleFlag(45767943, 0);
export const qny = new DoubleFlag(45741339, 0);
export const AWK = new DoubleFlag(45767763, 0);
export const xY7 = new DoubleFlag(45770002, 0);
export const BHK = new DoubleFlag(45770001, 0);

// =========================================================================
// Feature wrapper classes   [was: Z_W, EPW, lines 64309-64319]
// =========================================================================

/**
 * Simple wrapper holding a single value (generic feature).
 * [was: Z_W]
 */
export class FeatureWrapper { // was: Z_W
  constructor(value) { // was: constructor(Q)
    /** @type {*} [was: this.W] */
    this.value = value; // was: this.W = Q
  }
}

/**
 * Secondary feature wrapper.
 * [was: EPW]
 */
export class SecondaryFeatureWrapper { // was: EPW
  constructor(value) { // was: constructor(Q)
    /** @type {*} [was: this.W] */
    this.value = value; // was: this.W = Q
  }
}

// =========================================================================
// Third-party verification patterns   [was: Px, te3, Nfy, lines 64321-64323]
// =========================================================================

/**
 * Allowlisted URL patterns for third-party viewability verification.
 * [was: Px]
 * @type {string[]}
 */
export const THIRD_PARTY_VERIFICATION_URLS = "://secure-...imrworldwide.com/ ://cdn.imrworldwide.com/ ://aksecure.imrworldwide.com/ ://[^.]*.moatads.com ://youtube[0-9]+.moatpixel.com ://pm.adsafeprotected.com/youtube ://pm.test-adsafeprotected.com/youtube ://e[0-9]+.yt.srs.doubleverify.com www.google.com/pagead/xsul www.youtube.com/pagead/slav".split(" ");
// was: Px

/**
 * Regex to detect OCR tokens in URLs.
 * [was: te3]
 */
export const OCR_TOKEN_REGEX = /\bocr\b/; // was: te3

/**
 * Regex for bracket-delimited URL template parameters.
 * [was: Nfy]
 */
export const URL_TEMPLATE_PARAM_REGEX = /(?:\[|%5B)([a-getSlotState-Z0-9_]+)(?:\]|%5D)/g; // was: Nfy

// =========================================================================
// Config proto classes   [was: sy0, do7, iNw, ST0, lines 64324-64379]
// =========================================================================

/**
 * Config option proto (variant A, 500-byte limit).
 * [was: sy0]
 */
export class ConfigOptionA extends ProtobufMessage { // was: sy0 extends Zd
  constructor(data) { super(data, 500); }
}

/**
 * Config option proto (variant B, 500-byte limit).
 * [was: do7 (the class at 64330)]
 */
export class ConfigOptionB extends ProtobufMessage { // was: do7 extends Zd (at line 64330)
  constructor(data) { super(data, 500); }
}

/**
 * Named config item proto with options.
 * [was: iNw]
 */
export class NamedConfigItem extends ProtobufMessage { // was: iNw extends Zd
  constructor(data) { super(data); }

  getName() { return Ve(this, 1); }

  getOptions() { return W_(this, ConfigOptionB, 3); }

  clearOptions() { return wD(this, 3); }
}

/**
 * Config item deserialiser factory.
 * Parses JSON into a protobuf class with getName/getOptions/clearOptions/OV/BB.
 * [was: ST0]
 */
export const deserializeConfigItem = (function (ProtoClass) {
  return (jsonStr) => {
    let data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) {
      throw Error("Expected jspb data to be an array, got " + NX(data) + ": " + data);
    }
    data[SLOT_ARRAY_STATE] |= 34;
    return new ProtoClass(data);
  };
})(class extends ProtobufMessage {
  constructor(data) { super(data); }
  getName() { return Ve(this, 1); }
  getOptions() { return W_(this, ConfigOptionA, 3); }
  clearOptions() { return wD(this, 3); }
  OV() { return B_(this, 6); }
  BB(value) { H_(this, 6, value); }
}); // was: ST0

// =========================================================================
// Signals framework   [was: uZ, zT, Jd, Eyx, lines 64380-64409]
// =========================================================================

/** @type {symbol} Signal internal marker [was: uZ] */
export const SIGNAL_INTERNAL = Symbol(); // was: uZ = Symbol()

/** @type {symbol} Signal tracking marker [was: zT] */
export const SIGNAL_TRACKING = Symbol(); // was: zT = Symbol()

/** @type {boolean} Signals change detection active [was: CG] */
let signalChangeActive = false; // was: CG = !1

/** @type {number} Signal version counter [was: dfx] */
let signalVersion = 1; // was: dfx = 1

/** @type {symbol} Signal property key [was: Jd] */
export const SIGNAL_KEY = Symbol("SIGNAL"); // was: Jd = Symbol("SIGNAL")

/**
 * Default signal node template.
 *
 * [was: Eyx]
 * @type {Object}
 */
export const DEFAULT_SIGNAL_NODE = { // was: Eyx
  version: 0,
  QrI: 0,
  LISTENABLE_KEY: false,
  producers: undefined,
  tQJ: undefined,
  GZ: undefined,
  pJ2: undefined,
  Tje: false,
  wJ0: false,
  aEH: false,
  kind: "signal",
  m6H: () => false,
  bUG: () => {},
  uK: () => {},
  IEy: () => {},
  M0: function (a, b) { return Object.is(a, b); },
  value: undefined,
};

// =========================================================================
// NetworkMonitor   [was: pG, lines 64410-64445]
// =========================================================================

/**
 * Monitors network connectivity via `navigator.onLine` and periodic polling.
 * Dispatches events when online/offline state changes.
 *
 * [was: pG]
 */
export class NetworkMonitor extends EventTargetBase { // was: pG extends g.$R
  /**
   * @param {Object} [scheduler] - Custom timer functions [was: Q]
   */
  constructor(scheduler) { // was: constructor(Q)
    super();

    /** @type {number} Pending timer handle [was: this.K] */
    this.pendingTimer = 0; // was: this.K = 0 (also this.O = 0)

    /** @type {Object} Timer functions [was: this.jF] */
    this.scheduler = scheduler ?? {
      SlotIdFulfilledNonEmptyTrigger: (fn, delay) => setTimeout(fn, delay),
      Q$: (handle) => { clearTimeout(handle); },
    };

    /** @type {boolean} Current online state [was: this.W] */
    this.isOnline = window.navigator?.onLine ?? true;

    /** @type {Function} Bound handler for online/offline events [was: this.A] */
    this.handleConnectivityChange = async () => {
      await probeNetworkStatus(this);
    };

    window.addEventListener("offline", this.handleConnectivityChange);
    window.addEventListener("online", this.handleConnectivityChange);

    if (!this.pendingTimer) this.startPolling(); // was: this.K || this.JF()
  }

  /**
   * Clean up event listeners and timers.
   * [was: dispose]
   */
  dispose() { // was: dispose()
    window.removeEventListener("offline", this.handleConnectivityChange);
    window.removeEventListener("online", this.handleConnectivityChange);
    this.scheduler.Q$(this.pendingTimer);
    delete NetworkMonitor.instance;
  }

  /**
   * Returns the current online state.
   * [was: KU]
   * @returns {boolean}
   */
  getOnlineState() { // was: KU()
    return this.isOnline;
  }

  /**
   * Start periodic connectivity polling (every 30 seconds).
   * [was: JF]
   */
  startPolling() { // was: JF()
    this.pendingTimer = this.scheduler.SlotIdFulfilledNonEmptyTrigger(async () => {
      if (this.isOnline) {
        if (!window.navigator?.onLine) await probeNetworkStatus(this);
      } else {
        await probeNetworkStatus(this);
      }
      this.startPolling();
    }, 30000);
  }
}

// =========================================================================
// Proto message classes / wire formats   [was: LT7, b_W, etc., lines 64447-64472]
// =========================================================================

/** Proto message. [was: LT7] */
export class ProtoMessageA extends ProtobufMessage { // was: LT7
  constructor(data) { super(data); }
}

/** Wire format tables [was: wMm, St] */
export const WIRE_FORMAT_A = [0, fixed32RawReader, -1]; // was: wMm
export const WIRE_FORMAT_B = [0, int64SignedReader, -1]; // was: St

/** Proto message. [was: b_W] */
export class ProtoMessageB extends ProtobufMessage { // was: b_W
  constructor(data) { super(data); }
}

// (Complex wire format tables jy7, wIR omitted for brevity --
//  they are mechanical proto-descriptor arrays.)

// =========================================================================
// BitField   [was: e1W, lines 64473-64485]
// =========================================================================

/**
 * 52-bit boolean bit-field backed by a sparse array.
 * Used for compact feature-flag tracking.
 *
 * [was: e1W]
 */
export class BitField { // was: e1W
  constructor() {
    /** @type {Array<boolean>} Underlying data [was: this.data] */
    this.data = [];

    /** @type {number} Cached hash (-1 = dirty) [was: this.W] */
    this.cachedHash = -1; // was: this.W = -1
  }

  /**
   * Set a bit at the given position.
   * [was: set]
   * @param {number} position [was: Q]
   * @param {boolean} [value=true] [was: c]
   */
  set(position, value = true) { // was: set(Q, c=!0)
    if (position >= 0 && position < 52 && Number.isInteger(position) && this.data[position] !== value) {
      this.data[position] = value;
      this.cachedHash = -1; // Invalidate cache
    }
  }

  /**
   * Get a bit at the given position.
   * [was: get]
   * @param {number} position [was: Q]
   * @returns {boolean}
   */
  get(position) { // was: get(Q)
    return !!this.data[position];
  }
}

// AnimationFrameTimer class defined in core/bitstream-helpers.js [was: g.T5]

// ThrottleTimer class defined in core/bitstream-helpers.js [was: g.Uc]

// =========================================================================
// Throttle   [was: g.F_, lines 64561-64593]
// =========================================================================

/**
 * Throttled function invocation with pause/resume support.
 * Ensures the wrapped function is called at most once per interval.
 *
 * [was: g.F_]
 *
 * Note: Also exported as `DelayedCall` alias to distinguish from
 * ThrottleTimer in core/bitstream-helpers.js (which is g.Uc).
 */
export const DelayedCall = class extends Disposable {
  /**
   * @param {Function} fn - The function to throttle [was: Q]
   * @param {number} intervalMs - Minimum interval in ms [was: c]
   * @param {*} [context] - `this` context for fn [was: W]
   */
  constructor(fn, intervalMs, context) { // was: constructor(Q, c, W)
    super();

    /** @type {Function} Bound function [was: this.K] */
    this.throttledFn = context != null ? fn.bind(context) : fn;

    /** @type {number} [was: this.eW] */
    this.intervalMs = intervalMs;

    /** @type {?IArguments} Last arguments [was: this.A] */
    this.lastArgs = null;

    /** @type {boolean} Pending flag [was: this.W] */
    this.isPending = false;

    /** @type {number} Pause depth [was: this.O] */
    this.pauseDepth = 0;

    /** @type {?number} Timer handle [was: this.ot] */
    this.timerHandle = null;
  }

  /**
   * Invoke the throttled function (may be deferred).
   * [was: j]
   */
  invoke() { // was: j(Q)
    this.lastArgs = arguments;
    if (!this.timerHandle && !this.pauseDepth) {
      scheduleDebounce(this);
    } else {
      this.isPending = true;
    }
  }

  /**
   * Cancel pending invocation.
   * [was: stop]
   */
  stop() { // was: stop()
    if (this.timerHandle) {
      globalRef.clearTimeout(this.timerHandle);
      this.timerHandle = null;
      this.isPending = false;
      this.lastArgs = null;
    }
  }

  /**
   * Increment pause depth.
   * [was: pause]
   */
  pause() { this.pauseDepth++; }

  /**
   * Decrement pause depth; flush if pending.
   * [was: resume]
   */
  resume() {
    this.pauseDepth--;
    if (!this.pauseDepth && this.isPending && !this.timerHandle) {
      this.isPending = false;
      scheduleDebounce(this);
    }
  }

  /** [was: WA] */
  disposeApp() { super.disposeApp(); this.stop(); }
};

// =========================================================================
// MappedIterator   [was: g.gPw, lines 64595-64610]
// =========================================================================

/**
 * Lazy mapping iterator -- applies a transform function to each element
 * of a source iterator on demand.
 *
 * [was: g.gPw]
 */
g.gPw = class {
  /**
   * @param {Iterable} source [was: Q]
   * @param {Function} mapFn [was: c]
   */
  constructor(source, mapFn) { // was: constructor(Q, c)
    /** @type {Iterator} [was: this.W] */
    this.sourceIterator = source[globalRef.Symbol.iterator]();

    /** @type {Function} [was: this.O] */
    this.mapFn = mapFn;
  }

  [Symbol.iterator]() { return this; }

  /**
   * @returns {{ value: *, done: boolean }}
   */
  next() {
    const item = this.sourceIterator.next(); // was: Q
    return {
      value: item.done ? undefined : this.mapFn.call(undefined, item.value),
      done: item.done,
    };
  }
};

// =========================================================================
// Animation base   [was: g.H7, lines 64612-64640]
// =========================================================================

// CssAnimation class (with animation lifecycle methods) is defined in
// core/bitstream-helpers.js [was: g.H7]

// =========================================================================
// CSS transition animation   [was: NI, lines 64655-64702]
// =========================================================================

// NI extends g.H7 -- CSS opacity transition animation.
// (play, KP, stop, v6, WA, pause methods.)
// See source for full implementation.

// =========================================================================
// Safe CSS function allowlist   [was: jaR, lines 64704-64737]
// =========================================================================

/**
 * Allowlist of CSS function names considered safe for dynamic style injection.
 *
 * [was: jaR]
 * @type {Object<string, boolean>}
 */
export const SAFE_CSS_FUNCTIONS = { // was: jaR
  rgb: true, rgba: true, alpha: true, rect: true, image: true,
  "linear-gradient": true, "radial-gradient": true,
  "repeating-linear-gradient": true, "repeating-radial-gradient": true,
  "cubic-bezier": true, matrix: true, perspective: true,
  rotate: true, rotate3d: true, rotatex: true, rotatey: true,
  steps: true, rotatez: true,
  scale: true, scale3d: true, scalex: true, scaley: true, scalez: true,
  skew: true, skewx: true, skewy: true,
  translate: true, translate3d: true, translatex: true, translatey: true, translatez: true,
  "var": true,
};

// =========================================================================
// DOM property guards   [was: yN, SC, vy_, aOR, lines 64738-64752]
// =========================================================================

// These are Trusted Types / property-guard registrations.
// See source lines 64738-64748.

// AsyncQueue (PubSub) class defined in core/bitstream-helpers.js [was: g.$K]
