/**
 * metrics-keys.js -- QoE metric key definitions, playback statistics
 * parameter names, URL-based debug flag parsing, and event wiring helpers.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~59206-59563
 *
 * Covers:
 *  - Debug-flag URL parsing from document.URL          (u_7 / mL)
 *  - Event wiring helper                               (m_)
 *  - Metric key extractor factories                    (Te, oB, Y4W, kew)
 *  - Event-type filter presets                          (ra, U4)
 *  - Display playback-statistics key map                (pj3)
 *  - Audio+video playback-statistics key map            (Q50)
 *  - Audio-only supplementary key map                   (cOO)
 *  - Viewability state bitmask registry                 (KVn)
 *  - Bitfield per-second tracker                        (IB)
 *  - Media metric accumulator                           (TbX)
 */
import { doc } from '../proto/messages-core.js'; // was: cN
import { getCurrentScreenId } from '../modules/remote/mdx-client.js'; // was: p1
import { LatencyReporter } from '../ads/ad-interaction.js'; // was: p2
import { LISTENER_MAP_KEY } from './event-logging.js'; // was: bs
import { isShareButtonAvailable } from '../ui/progress-bar-impl.js'; // was: a1
import { parseAspectRatio } from '../core/composition-helpers.js'; // was: a2
import { cancelPendingTransitions } from '../player/state-init.js'; // was: ft
import { filterAndSortFormats } from './bandwidth-tracker.js'; // was: as
import { getDoubleClickStatus } from '../network/uri-utils.js'; // was: i1
import { ensureFallbackGenerator } from '../player/video-loader.js'; // was: i2
import { isAutoplayEligible } from '../features/autoplay.js'; // was: c0
import { generateScopedId } from './visual-element-tracking.js'; // was: c1
import { createPolyfillAccessor } from '../core/polyfills.js'; // was: c3
import { transitionPanel } from '../player/video-loader.js'; // was: mc
import { detectAutoplayPolicy } from '../ads/ad-async.js'; // was: nc
import { updateClipPath } from '../ui/seek-bar-tail.js'; // was: nv
import { getCaptionsInitialState } from '../modules/caption/caption-settings.js'; // was: tu
import { voidSink } from '../core/event-system.js'; // was: vs
import { yieldValue } from '../ads/ad-async.js'; // was: am
import { checkFormatCompatibility } from '../media/gapless-playback.js'; // was: pv
import { filter, slice } from '../core/array-utils.js';
import { contains } from '../core/string-utils.js';



// ── imports (from core layer) ────────────────────────────────────────────
// In the original bundle these are all module-level functions/classes.
// Uncomment or adjust the paths to match your core re-exports.
//
// import { addEventListener as addDomEventListener } from '../core/dom-event.js'; // was: qf
// import { wrapWithErrorReporting } from '../core/errors.js';                      // was: Gd

// =========================================================================
// Debug-flag URL parsing   [was: u_7 / mL block, lines 59206-59222]
// =========================================================================

/**
 * If the current document has a URL, parse a `google_debug` query / fragment
 * parameter out of it.  When present the debug flag string is stored in
 * `debugFlagValue`; the global settings object `ak.H6` is set to `false`
 * when debugging is active.
 *
 * [was: u_7, mL, hfW]
 */
let debugFlagValue; // was: mL
if (typeof doc !== 'undefined' && doc && doc.URL) { // cN = document reference
  const documentUrl = doc.URL; // was: u_7
  const googleDebugRe = RegExp('.*[&#?]google_debug(=[^&]*)?(&.*)?$'); // was: hfW
  debugFlagExtraction: {
    if (documentUrl) {
      try {
        const match = googleDebugRe.exec(decodeURIComponent(documentUrl)); // was: Q
        if (match) {
          debugFlagValue =
            match[1] && match[1].length > 1
              ? match[1].substring(1)
              : 'true';
          break debugFlagExtraction;
        }
      } catch { /* ignore URI-malformed */ }
    }
    debugFlagValue = '';
  }
  ak.H6 = !(debugFlagValue.length > 0);
}

export { debugFlagValue };

// =========================================================================
// Event wiring helper   [was: m_, lines 59223-59228]
// =========================================================================

/**
 * Convenience wrapper that calls `wrapWithErrorReporting` on the callback,
 * then attaches it via `addEventListener` with `{ capture: false }`.
 *
 * @param {EventTarget} target     - DOM element or event target  [was: Q]
 * @param {string}      eventName  - DOM event type               [was: c]
 * @param {Function}    handler    - raw callback                 [was: W]
 * @param {number}      errorId    - error-reporting context id   [was: m]
 *
 * [was: m_]
 */
export const wireEvent = (target, eventName, handler, errorId) => { // was: m_
  handler = Gd(errorId, handler); // was: Gd(m, W) — wraps with error-reporting
  qf(target, eventName, handler, { capture: false }); // was: qf(Q, c, W, { capture: !1 })
};

// =========================================================================
// Metric key extractor factories   [was: Te, oB, Y4W, kew, lines 59405-59418]
// =========================================================================

/**
 * Creates a metric-key extractor that reads an array property from the data
 * row, then applies a bucketed reduction via `bucketedReduceArray`.
 *
 * @param {string}   propertyName      - key to read from the row          [was: Q]
 * @param {number[]} bucketIndices     - indices for bucketing              [was: c]
 * @param {boolean}  [useFilter=true]  - use filter mode vs. prefix-sum    [was: W]
 * @param {Function} [guard=()=>true]  - predicate the row must pass       [was: m]
 * @returns {Function} extractor(row) => value | undefined
 *
 * [was: Te]
 */
export const createArrayMetricExtractor = (propertyName, bucketIndices, useFilter = true, guard = () => true) => // was: Te
  (row) => { // was: K
    const arr = row[propertyName]; // was: T
    if (Array.isArray(arr) && guard(row)) {
      return bucketedReduceArray(arr, bucketIndices, useFilter); // was: kew(T, c, W)
    }
  };

/**
 * Creates an extractor that returns `row[prop]` only when `predicate(row)`
 * is truthy; otherwise returns `undefined`.
 *
 * @param {string}   prop       [was: Q]
 * @param {Function} predicate  [was: c]
 * @returns {Function} extractor(row) => value | undefined
 *
 * [was: oB]
 */
export const createConditionalExtractor = (prop, predicate) => // was: oB
  (row) => predicate(row) ? row[prop] : undefined; // was: W => c(W) ? W[Q] : void 0

/**
 * Creates a predicate that returns `true` when `row.e` matches any value in
 * `allowedEventTypes` (including `undefined` → missing `e` property).
 *
 * @param {Array} allowedEventTypes  [was: Q]
 * @returns {Function} predicate(row) => boolean
 *
 * [was: Y4W]
 */
export const createEventTypeFilter = (allowedEventTypes) => // was: Y4W
  (row) => { // was: c
    for (let i = 0; i < allowedEventTypes.length; i++) {
      if (
        allowedEventTypes[i] === row.e ||
        (allowedEventTypes[i] === undefined && !row.hasOwnProperty('e'))
      ) {
        return true;
      }
    }
    return false;
  };

/**
 * Performs either a filtered-map (when `useFilter` is true) or a
 * prefix-sum-based bucketed reduction on `arr` using `bucketIndices`.
 *
 * @param {number[]} arr            - source array                  [was: Q]
 * @param {number[]} bucketIndices  - bucket boundary indices       [was: c]
 * @param {boolean}  [useFilter=true]                               [was: W]
 * @returns {number[]|number}
 *
 * [was: kew]
 */
const bucketedReduceArray = (arr, bucketIndices, useFilter = true) => // was: kew
  useFilter
    ? filter(arr, (val, idx) => contains(bucketIndices, idx)) // was: g.uw(Q, (m, K) => g.c9(c, K))
    : map(bucketIndices, (boundary, idx, all) => // was: g.hy(c, (m, K, T) =>
        arr
          .slice(idx > 0 ? all[idx - 1] + 1 : 0, boundary + 1)
          .reduce((sum, v) => sum + v, 0)
      );

// =========================================================================
// Event-type filter presets   [was: ra, U4, lines 59418-59419]
// =========================================================================

/**
 * Broad event-type filter — accepts `undefined` (no event), plus types
 * 1, 2, 3, 4, 8, 16.
 * [was: ra]
 */
export const BROAD_EVENT_FILTER = createEventTypeFilter([undefined, 1, 2, 3, 4, 8, 16]); // was: ra

/**
 * Narrow event-type filter — accepts `undefined`, 4, 8, 16.
 * [was: U4]
 */
export const NARROW_EVENT_FILTER = createEventTypeFilter([undefined, 4, 8, 16]); // was: U4

// =========================================================================
// Display playback-statistics key map   [was: pj3, lines 59420-59549]
// =========================================================================

/**
 * Maps canonical metric key names to either a pass-through string
 * (the metric is copied verbatim from the data row) or an extractor
 * function that derives the value.
 *
 * Used for non-audio (display / video) ad-viewability pings.
 *
 * [was: pj3]
 * @type {Record<string, string | Function>}
 */
export const DISPLAY_METRIC_KEYS = { // was: pj3
  sv: 'sv',                               // schema version
  v: 'v',                                 // player version
  cb: 'cb',                               // callback type
  e: 'e',                                 // event type
  nas: 'nas',                             // number of ad slots
  msg: 'msg',                             // message identifier
  'if': 'if',                             // iframe depth
  sdk: 'sdk',                             // SDK indicator
  p: 'p',                                 // page visibility
  p0: createConditionalExtractor('p0', NARROW_EVENT_FILTER), // was: oB("p0", U4)
  getCurrentScreenId: createConditionalExtractor('p1', NARROW_EVENT_FILTER), // was: oB("p1", U4)
  LatencyReporter: createConditionalExtractor('p2', NARROW_EVENT_FILTER), // was: oB("p2", U4)
  p3: createConditionalExtractor('p3', NARROW_EVENT_FILTER), // was: oB("p3", U4)
  cp: 'cp',                               // creative page URL
  tos: 'tos',                             // time on screen (ms)
  mtos: 'mtos',                           // MRC time on screen
  amtos: 'amtos',                         // audible MRC time on screen
  mtos1: createArrayMetricExtractor('mtos1', [0, 2, 4], false, NARROW_EVENT_FILTER), // was: Te("mtos1", [0, 2, 4], !1, U4)
  mtos2: createArrayMetricExtractor('mtos2', [0, 2, 4], false, NARROW_EVENT_FILTER), // was: Te("mtos2", [0, 2, 4], !1, U4)
  mtos3: createArrayMetricExtractor('mtos3', [0, 2, 4], false, NARROW_EVENT_FILTER), // was: Te("mtos3", [0, 2, 4], !1, U4)
  mcvt: 'mcvt',                           // MRC custom viewable time
  ps: 'ps',                               // player state
  scs: 'scs',                             // screen state
  LISTENER_MAP_KEY: 'bs',                               // background state
  vht: 'vht',                             // viewable height threshold
  mut: 'mut',                             // mute state
  a: 'a',                                 // audibility
  a0: createConditionalExtractor('a0', NARROW_EVENT_FILTER), // was: oB("a0", U4)
  isShareButtonAvailable: createConditionalExtractor('a1', NARROW_EVENT_FILTER), // was: oB("a1", U4)
  parseAspectRatio: createConditionalExtractor('a2', NARROW_EVENT_FILTER), // was: oB("a2", U4)
  a3: createConditionalExtractor('a3', NARROW_EVENT_FILTER), // was: oB("a3", U4)
  cancelPendingTransitions: 'ft',                               // first time
  dft: 'dft',                             // delta first time
  at: 'at',                               // active time
  dat: 'dat',                             // delta active time
  filterAndSortFormats: 'as',                               // active state
  vpt: 'vpt',                             // viewable play time
  gmm: 'gmm',                             // geometric mean measurable
  std: 'std',                             // standard deviation
  efpf: 'efpf',                           // eligible for playback fraction
  swf: 'swf',                             // SWF indicator
  nio: 'nio',                             // native IntersectionObserver
  px: 'px',                               // pixel density
  nnut: 'nnut',                           // non-native update time
  vmer: 'vmer',                           // video metadata error
  vmmk: 'vmmk',                           // video metadata missing keys
  vmiec: 'vmiec',                         // video metadata internal error code
  nmt: 'nmt',                             // native media time
  tcm: 'tcm',                             // time creative measurable
  bt: 'bt',                               // buffer time
  pst: 'pst',                             // playback start time
  vpaid: 'vpaid',                         // VPAID indicator
  dur: 'dur',                             // duration
  vmtime: 'vmtime',                       // video media time
  dtos: 'dtos',                           // display time on screen
  dtoss: 'dtoss',                         // display time on screen (sum)
  dvs: 'dvs',                             // display viewable seconds
  dfvs: 'dfvs',                           // display fully-viewable seconds
  dvpt: 'dvpt',                           // display viewable play time
  fmf: 'fmf',                             // first measurable frame
  vds: 'vds',                             // viewable display seconds
  is: 'is',                               // impression state
  i0: 'i0',                               // impression bucket 0
  getDoubleClickStatus: 'i1',                               // impression bucket 1
  ensureFallbackGenerator: 'i2',                               // impression bucket 2
  i3: 'i3',                               // impression bucket 3
  ic: 'ic',                               // impression count
  cs: 'cs',                               // creative size
  c: 'c',                                 // creative type
  isAutoplayEligible: createConditionalExtractor('c0', NARROW_EVENT_FILTER), // was: oB("c0", U4)
  generateScopedId: createConditionalExtractor('c1', NARROW_EVENT_FILTER), // was: oB("c1", U4)
  c2: createConditionalExtractor('c2', NARROW_EVENT_FILTER), // was: oB("c2", U4)
  createPolyfillAccessor: createConditionalExtractor('c3', NARROW_EVENT_FILTER), // was: oB("c3", U4)
  transitionPanel: 'mc',                               // measurable creative
  detectAutoplayPolicy: 'nc',                               // non-measurable creative
  mv: 'mv',                               // measurable viewable
  updateClipPath: 'nv',                               // non-viewable
  qmt: createConditionalExtractor('qmtos', BROAD_EVENT_FILTER), // was: oB("qmtos", ra)
  qnc: createConditionalExtractor('qnc', BROAD_EVENT_FILTER),   // was: oB("qnc", ra)
  qmv: createConditionalExtractor('qmv', BROAD_EVENT_FILTER),   // was: oB("qmv", ra)
  qnv: createConditionalExtractor('qnv', BROAD_EVENT_FILTER),   // was: oB("qnv", ra)
  raf: 'raf',                             // requestAnimationFrame count
  rafc: 'rafc',                           // RAF callback count
  lte: 'lte',                             // late event
  ces: 'ces',                             // creative-element-size
  tth: 'tth',                             // time to hidden
  femt: 'femt',                           // first element measurement time
  femvt: 'femvt',                         // first element measurement viewable time
  emc: 'emc',                             // element measurement count
  emuc: 'emuc',                           // element measurement unchanged count
  emb: 'emb',                             // element measurement bounds
  avms: 'avms',                           // audio/video measurement state
  nvat: 'nvat',                           // non-viewable active time
  qi: 'qi',                               // quartile index
  psm: 'psm',                             // player state measurable
  psv: 'psv',                             // player state viewable
  psfv: 'psfv',                           // player state fully viewable
  psa: 'psa',                             // player state audible
  pnk: 'pnk',                            // ping network kind
  pnc: 'pnc',                            // ping network connection
  pnmm: 'pnmm',                          // ping network max-min
  pns: 'pns',                             // ping network speed
  ptlt: 'ptlt',                           // ping total latency
  pngs: 'pings',                          // ping count (wire name: "pings")
  veid: 'veid',                           // visual element ID
  ssb: 'ssb',                             // server-side beacon
  ss0: createConditionalExtractor('ss0', NARROW_EVENT_FILTER), // was: oB("ss0", U4)
  ss1: createConditionalExtractor('ss1', NARROW_EVENT_FILTER), // was: oB("ss1", U4)
  ss2: createConditionalExtractor('ss2', NARROW_EVENT_FILTER), // was: oB("ss2", U4)
  ss3: createConditionalExtractor('ss3', NARROW_EVENT_FILTER), // was: oB("ss3", U4)
  dc_rfl: 'urlsigs',                      // DoubleClick URL signatures (wire: "urlsigs")
  obd: 'obd',                             // out-of-bounds detection
  omidp: 'omidp',                         // OMID partner name
  omidr: 'omidr',                         // OMID partner resource
  omidv: 'omidv',                         // OMID vendor
  omida: 'omida',                         // OMID API version
  omids: 'omids',                         // OMID session ID
  omidpv: 'omidpv',                       // OMID partner version
  omidam: 'omidam',                       // OMID access mode
  omidct: 'omidct',                       // OMID creative type
  omidia: 'omidia',                       // OMID impression action
  omiddc: 'omiddc',                       // OMID device category
  omidlat: 'omidlat',                     // OMID latency
  omiddit: 'omiddit',                     // OMID display impression time
  nopd: 'nopd',                           // no-op disposition
  co: 'co',                               // cross-origin flag
  tm: 'tm',                               // timestamp
  getCaptionsInitialState: 'tu',                               // time unit
};

// =========================================================================
// Audio+Video playback-statistics key map   [was: Q50, lines 59550-59554]
// =========================================================================

/**
 * Extension of `DISPLAY_METRIC_KEYS` with audio-specific keys
 * (`avid`, `avas`, `vs`) used for VAST video+audio pings.
 *
 * [was: Q50]
 * @type {Record<string, string | Function>}
 */
export const AUDIO_VIDEO_METRIC_KEYS = Object.assign({}, DISPLAY_METRIC_KEYS, { // was: Q50
  avid: fs('audio'),  // was: fs("audio") — audio viewability ID factory
  avas: 'avas',       // audio-video audibility state
  voidSink: 'vs',           // viewability status
});

// =========================================================================
// Audio-only supplementary key map   [was: cOO, lines 59555-59563]
// =========================================================================

/**
 * Supplementary metric keys for audio-only tracking.
 *
 * [was: cOO]
 * @type {Record<string, string | Function>}
 */
export const AUDIO_SUPPLEMENTARY_KEYS = { // was: cOO
  atos: 'atos',                                                     // audio time on screen
  avt: createArrayMetricExtractor('atos', [2]),                     // was: Te("atos", [2]) — audio viewable time (bucketed)
  davs: 'davs',                                                    // delta audio viewable seconds
  dafvs: 'dafvs',                                                  // delta audio fully-viewable seconds
  dav: 'dav',                                                      // delta audio viewable
  ss: ((prop, defaultVal) => (row) =>                               // was: inline IIFE for "ss"
    row[prop] === undefined && defaultVal !== undefined
      ? defaultVal
      : row[prop]
  )('ss', 0),                                                       // session state (default 0)
  t: 't',                                                           // time
};

// =========================================================================
// Viewability state bitmask registry   [was: KVn, lines 59573-59603]
// =========================================================================

/**
 * Registry of viewability condition flags. Each condition maps to a
 * two-element array `[sendMask, receiveMask]` of bitmask values.
 * `sendMask` indicates the flag's position when transmitting;
 * `receiveMask` indicates the position when receiving.
 *
 * [was: KVn]
 */
export class ViewabilityBitmaskRegistry { // was: KVn
  constructor() {
    /**
     * Bitmask definitions per condition name.
     * @type {Record<string, [number, number]>}
     * [was: this.O]
     */
    this.definitions = { // was: this.O
      voidSink:     [1, 0],           // visible
      vw:     [0, 1],           // viewable (50%+ for display, 100% for video)
      yieldValue:     [2, 2],           // audibility measurable
      a:      [4, 4],           // audible
      f:      [8, 8],           // fullscreen
      bm:     [16, 16],         // background measurable
      b:      [32, 32],         // background
      avw:    [0, 64],          // audio-viewable (receive-only)
      avs:    [64, 0],          // audio-visible  (send-only)
      checkFormatCompatibility:     [256, 256],       // partially viewable
      gdr:    [0, 512],         // GroupM Digital Reach
      p:      [0, 1024],        // paused
      r:      [0, 2048],        // resumed
      m:      [0, 4096],        // muted
      um:     [0, 8192],        // unmuted
      ef:     [0, 16384],       // exit-fullscreen
      s:      [0, 32768],       // skipped
      pmx:    [0, 16777216],    // playback measurable threshold crossed
      mut:    [33554432, 33554432],   // mute state active
      umutb:  [67108864, 67108864],   // unmuted in background
      tvoff:  [134217728, 134217728], // TV off
    };

    /**
     * Accumulated receive-side flags, one entry per condition whose
     * receive mask is > 0.
     * @type {Record<string, number>}
     * [was: this.W]
     */
    this.accumulatedFlags = {}; // was: this.W
    for (const key in this.definitions) {
      if (this.definitions[key][1] > 0) {
        this.accumulatedFlags[key] = 0;
      }
    }

    /** @type {number} current composite bitmask [was: this.A] */
    this.currentMask = 0; // was: this.A
  }
}

// =========================================================================
// Bitfield per-second tracker   [was: IB, lines 59605-59616]
// =========================================================================

/**
 * Tracks a per-second boolean property via a 32-bit bitmask where each bit
 * corresponds to one second of media time. `update(second, value)` sets or
 * clears the bit for that second; `getValue()` returns the current mask.
 *
 * [was: IB]
 */
export class BitfieldTracker { // was: IB
  constructor() {
    /** @type {number} accumulated value bitmask [was: this.O] */
    this.value = 0; // was: this.O
    /** @type {number} "seen" bitmask — tracks which seconds have been set [was: this.W] */
    this.seenMask = 0; // was: this.W
  }

  /**
   * @returns {number} the current accumulated bitmask
   * [was: getValue]
   */
  getValue() {
    return this.value; // was: this.O
  }

  /**
   * Update the bit for `second`. First write wins for a given second;
   * subsequent writes with a different value are ignored.
   *
   * @param {number} second  - media second (0-31) [was: Q]
   * @param {boolean} flag   - value to record      [was: c]
   * [was: update]
   */
  update(second, flag) { // was: update(Q, c)
    if (second >= 32) return;
    if (this.seenMask & (1 << second) && !flag) {
      this.value &= ~(1 << second);
    } else if (!(this.seenMask & (1 << second)) && flag) {
      this.value |= (1 << second);
    }
    this.seenMask |= (1 << second);
  }
}

// =========================================================================
// Media metric accumulator   [was: TbX, lines 59618-59654]
// =========================================================================

/**
 * Extends the base viewability-metric accumulator (`lB0`) with additional
 * media-specific accumulators: play-time tracking, volume min/max,
 * fullscreen time, and per-second bitfield trackers for visibility,
 * full-area, and audibility.
 *
 * [was: TbX]
 */
export class MediaMetricAccumulator extends SurveyRendererMetadata { // was: TbX extends lB0
  constructor() {
    super();

    this.playTime = new cj();             // was: this.A — accumulated play-time tracker
    this.viewablePlayTime = 0;            // was: this.T2
    this.audibleViewableTime = 0;         // was: this.Y
    this.pauseAccumulator = 0;            // was: this.PA
    this.pauseStart = -1;                 // was: this.L
    this.fullscreenTime = new cj();       // was: this.Y0
    this.audibleTime = new cj();          // was: this.K
    this.viewabilityBuckets = new AdHoverTextButtonMetadata();   // was: this.W
    this.minVolume = -1;                  // was: this.j
    this.maxVolume = -1;                  // was: this.D
    this.fullscreenAccumulator = new cj(); // was: this.mF
    this.completionThreshold = 2000;      // was: this.JJ (2 seconds in ms)

    /** Per-second bitfield: was visible [was: this.MM] */
    this.visibilityBitfield = new BitfieldTracker(); // was: new IB

    /** Per-second bitfield: 100% in-view [was: this.HA] */
    this.fullAreaBitfield = new BitfieldTracker(); // was: new IB

    /** Per-second bitfield: audible+visible [was: this.XI] */
    this.audibleVisibleBitfield = new BitfieldTracker(); // was: new IB
  }

  /**
   * Accumulates one measurement sample into the tracker.
   *
   * @param {number}  deltaMs        - elapsed ms since last sample   [was: Q]
   * @param {Object}  currentState   - current viewability snapshot    [was: c]
   * @param {Object}  previousState  - previous viewability snapshot   [was: W]
   * @param {boolean} isContinuous   - whether continuous playback     [was: m]
   *
   * [was: update]
   */
  update(deltaMs, currentState, previousState, isContinuous) { // was: update(Q, c, W, m)
    if (currentState.paused) return;

    super.update(deltaMs, currentState, previousState, isContinuous);

    const wasAudible = vN(currentState) && vN(previousState); // was: K
    const halfViewable =                                       // was: T
      (isContinuous
        ? Math.min(currentState.hA, previousState.hA)
        : previousState.hA) >= 0.5;

    // Track volume min/max
    if (k8(currentState.volume)) { // was: k8(c.volume)
      this.minVolume =
        this.minVolume !== -1
          ? Math.min(this.minVolume, currentState.volume)
          : currentState.volume;
      this.maxVolume = Math.max(this.maxVolume, currentState.volume);
    }

    // Accumulate viewable + audible-viewable time
    if (halfViewable) {
      this.viewablePlayTime += deltaMs;
      this.audibleViewableTime += wasAudible ? deltaMs : 0;
    }

    // Update sub-trackers
    this.viewabilityBuckets.update(currentState.hA, previousState.hA, currentState.W, deltaMs, isContinuous, wasAudible);
    this.playTime.update(true, deltaMs);
    this.audibleTime.update(wasAudible, deltaMs);
    this.fullscreenAccumulator.update(previousState.fullscreen, deltaMs);
    this.fullscreenTime.update(wasAudible && !halfViewable, deltaMs);

    // Per-second bitfield updates
    const mediaSecond = Math.floor(currentState.mediaTime / 1000); // was: Q
    this.visibilityBitfield.update(mediaSecond, currentState.isVisible());
    this.fullAreaBitfield.update(mediaSecond, currentState.hA >= 1);
    this.audibleVisibleBitfield.update(mediaSecond, vN(currentState));
  }
}
