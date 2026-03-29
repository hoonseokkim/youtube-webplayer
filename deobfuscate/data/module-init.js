/**
 * module-init.js -- Plugin/module initialization hooks, module registry,
 * lifecycle management, logging hooks and telemetry wiring.
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines 59564-59995, 60042-60993
 * (Lines 59996-60041 are covered in plugin-manager.js)
 *
 * Covers:
 *  - ViewabilityFlags (WV0): container for viewability flag strings
 *  - ViewabilityFlagMapper (mhO): base class for mapping ping data to flags
 *  - ViewabilityBitmask (KVn): bitmask registry for viewability criteria
 *  - BitmaskAccumulator (IB): 32-bit bitmask accumulator with conditional set/clear
 *  - MediaViewabilityTracker (TbX): per-session viewability metric accumulator
 *  - ViewabilityCondition (ov7): base condition-check with short-circuit
 *  - MetricCondition (X_): named metric condition with identifier and result encoding
 *  - MetricConditionWithHistory (rOK): condition that also records parameter history
 *  - MetricProviderBase (Uhn): base class for metric providers
 *  - NoOpMetricProvider (AU): no-op provider returning null/empty
 *  - ElementGeometryObserver (et): calculates visible rectangle & viewport intersection
 *  - NativeElementObserver (Xyd): geometry observer for native bridge environments
 *  - VideoQuartileNames (FpK): quartile name -> index map
 *  - AdViewabilitySession (AO_): full ad viewability session with duration, flags, etc.
 *  - FrameWalker (aCn): walks iframe hierarchy registering documents
 *  - EventBuffer (V9y): simple buffer for event arrays
 *  - IntersectionThresholds (v9x): default IntersectionObserver thresholds
 *  - IntersectionElementObserver (BbK): IO-backed geometry observer
 *  - IntersectionMeasurementProvider (Ip): provider wrapping IntersectionObserver
 *  - GeometricMeasurementPlugin (Kky): geometric (polling) measurement plugin
 *  - SamplingState (xh7): periodic viewability sampler state
 *  - SDK identification helpers (qXm, t3, aS)
 *  - Logging / ping formatters (Fl, Zx)
 *  - Custom metric criteria (zyR, ZL, cP7, Wk7)
 *  - Flag mapper implementations (nvx, LVK)
 *  - Built-in metric conditions (Dhw, HSW, Nb7, EvW, s5d)
 *  - Metric provider bundles (iSy, dh3)
 *  - Native bridge observers (yO3, TOO, SXO, ojO)
 *  - MRAID measurement plugin (EW)
 *  - Event handler manager (ZS7): ad lifecycle event dispatch
 *  - YouTube Active-View manager (y7): extends ZS7 with YT-specific logic
 *  - Global API exposure (bSm, j5X, gvO, OSO)
 *  - Ping URL wrapper (BG_)
 *  - Module error class (g5)
 *  - Web Player Container bindings (yPn, w5)
 *  - Shared disposable (fNx): reference-counted disposable
 *  - Client Streamz reporters (vvy, aN3, Go_, $hK, Pl7, lNw, uzw, hN7, zN7, ClR)
 */

import { incrementCounter, registerCounter } from '../core/event-registration.js';  // was: g.ZE, g.SH
import { setPrototypeOf } from '../core/polyfills.js';  // was: g.Wmm
import { doc } from '../proto/messages-core.js';  // was: g.cN
import { PluginSlotHolder } from './plugin-manager.js';  // was: g.t_
import { voidSink } from '../core/event-system.js'; // was: vs
import { yieldValue } from '../ads/ad-async.js'; // was: am
import { checkFormatCompatibility } from '../media/gapless-playback.js'; // was: pv
import { ElementObserver } from '../proto/message-defs.js'; // was: aBm
import { reportTelemetry } from '../ads/dai-cue-range.js'; // was: PB
import { adTimingStart } from '../proto/message-defs.js'; // was: Ph
import { createDatabaseDefinition } from './idb-transactions.js'; // was: el
import { ViewabilityState } from '../proto/message-defs.js'; // was: OPx
import { QUALITY_LABELS_DESCENDING } from '../media/codec-tables.js'; // was: ZF
import { getErrorSampler } from './gel-params.js'; // was: i5
import { EPHEMERAL_STORE_TOKEN } from '../network/innertube-config.js'; // was: xO
import { wrapWithReporter } from '../proto/message-defs.js'; // was: w9
import { instreamAdPlayerOverlayRenderer } from '../core/misc-helpers.js'; // was: Re
import { ViewabilityManager } from '../proto/message-defs.js'; // was: QW
import { win } from '../proto/messages-core.js'; // was: bI
import { MeasurementClient } from '../proto/message-defs.js'; // was: pK
import { squeezebackSidePanel } from '../core/misc-helpers.js'; // was: Vy
import { queryDataHas } from '../core/bitstream-helpers.js'; // was: q1
import { ScheduledSampler } from '../proto/message-defs.js'; // was: vpn
import { lookupMetricIndex } from './module-init.js'; // was: Zx
import { shouldDeferAdModule } from '../player/caption-manager.js'; // was: Qr
import { DISPLAY_METRIC_KEYS } from './metrics-keys.js'; // was: pj3
import { AUDIO_SUPPLEMENTARY_KEYS } from './metrics-keys.js'; // was: cOO
import { OBSERVATION_RECORD_FIELDS } from '../proto/messages-media.js'; // was: Cd
import { wireEvent } from './metrics-keys.js'; // was: m_
import { wrapForOW } from '../proto/message-defs.js'; // was: OW
import { updateAutoHideFlags } from '../player/caption-manager.js'; // was: KI
import { AUDIO_VIDEO_METRIC_KEYS } from './metrics-keys.js'; // was: Q50
import { getOrCreateTrackingEvent } from '../core/misc-helpers.js'; // was: qyn
import { getOrCreateHeartbeatEvent } from '../core/misc-helpers.js'; // was: njR
import { registerConfigurableEvents } from '../core/misc-helpers.js'; // was: Diw
import { getExternalActivityBridge } from '../core/misc-helpers.js'; // was: tSx
import { isValidBox } from '../media/format-setup.js'; // was: Ma
import { setClickTrackingTarget } from '../core/misc-helpers.js'; // was: sN
import { createFadeTransition } from '../core/bitstream-helpers.js'; // was: iB
import { getActiveLayout } from '../ads/ad-scheduling.js'; // was: J1
import { registerHistogram } from '../core/event-registration.js'; // was: iS
import { FieldDescriptor } from '../proto/message-setup.js'; // was: n0
import { getExperimentNumber } from './idb-transactions.js'; // was: Y3
import { int64FieldDescriptor } from '../core/event-system.js'; // was: ap
import { toString, contains } from '../core/string-utils.js';
import { extendObject, isEmptyObject } from '../core/object-utils.js';
import { forEach } from '../core/event-registration.js';
import { getDuration } from '../player/time-tracking.js';
import { getObjectByPath } from '../core/type-helpers.js';
import { dispose } from '../ads/dai-cue-range.js';
import { remove } from '../core/array-utils.js';
import { handleError } from '../player/context-updates.js';
import { Disposable } from '../core/disposable.js';
// TODO: resolve g.JP
// TODO: resolve g.vB

// =========================================================================
// ViewabilityFlags   [was: WV0, lines 59564-59568]
// =========================================================================

/**
 * Simple container holding two viewability flag strings.
 *
 * [was: WV0]
 */
export class ViewabilityFlags { // was: WV0
  constructor() {
    /** @type {string} Primary flag string [was: this.W] */
    this.primary = ""; // was: this.W

    /** @type {string} Secondary flag string [was: this.O] */
    this.secondary = ""; // was: this.O
  }
}

// =========================================================================
// ViewabilityFlagMapper   [was: mhO, lines 59570-59571]
// =========================================================================

/**
 * Abstract base class for mapping ping/event data to viewability flag objects.
 *
 * [was: mhO]
 */
export class ViewabilityFlagMapper {} // was: mhO

// =========================================================================
// ViewabilityBitmask   [was: KVn, lines 59573-59603]
// =========================================================================

/**
 * Registry of named viewability criteria encoded as [send, receive] bitmask pairs.
 * Maintains a live state object (`.activeFlags`) tracking which criteria are
 * currently satisfied, and a cumulative bitmask (`.cumulativeMask`).
 *
 * The bitmask keys map to Active-View criteria:
 *  - vs/vw: visible/viewable
 *  - am/a/f: audible/muted/fullscreen
 *  - bm/b: background mode
 *  - avw/avs: audible+viewable / audible+visible
 *  - pv/gdr/p/r/m/um/ef/s: various engagement signals
 *  - pmx: premium metric
 *  - mut/umutb/tvoff: mute / unmute-by-browser / TV-off
 *
 * [was: KVn]
 */
export class ViewabilityBitmask { // was: KVn
  constructor() {
    /**
     * Criteria definitions: { name: [sendMask, receiveMask] }.
     * [was: this.O]
     * @type {Object<string, [number, number]>}
     */
    this.criteria = { // was: this.O
      voidSink:    [1, 0],
      vw:    [0, 1],
      yieldValue:    [2, 2],
      a:     [4, 4],
      f:     [8, 8],
      bm:    [16, 16],
      b:     [32, 32],
      avw:   [0, 64],
      avs:   [64, 0],
      checkFormatCompatibility:    [256, 256],
      gdr:   [0, 512],
      p:     [0, 1024],
      r:     [0, 2048],
      m:     [0, 4096],
      um:    [0, 8192],
      ef:    [0, 16384],
      s:     [0, 32768],
      pmx:   [0, 16777216],
      mut:   [33554432, 33554432],
      umutb: [67108864, 67108864],
      tvoff: [134217728, 134217728],
    };

    /**
     * Active flags -- only criteria whose receiveMask > 0 appear here, each starting at 0.
     * [was: this.W]
     * @type {Object<string, number>}
     */
    this.activeFlags = {}; // was: this.W
    for (const key in this.criteria) {
      if (this.criteria[key][1] > 0) {
        this.activeFlags[key] = 0;
      }
    }

    /**
     * Cumulative bitmask of all criteria currently set in this sampling interval.
     * [was: this.A]
     * @type {number}
     */
    this.cumulativeMask = 0; // was: this.A
  }
}

// =========================================================================
// BitmaskAccumulator   [was: IB, lines 59605-59616]
// =========================================================================

/**
 * A 32-bit bitmask accumulator with conditional set/clear semantics.
 * Each bit position (0..31) can be set or cleared exactly once; subsequent
 * writes to the same position are no-ops.
 *
 * [was: IB]
 */
export class BitmaskAccumulator { // was: IB
  constructor() {
    /** @type {number} Current accumulated value [was: this.O] */
    this.value = 0; // was: this.O

    /** @type {number} Bitmask of positions that have been written [was: this.W] */
    this.written = 0; // was: this.W
  }

  /**
   * Returns the current accumulated value.
   * @returns {number}
   */
  getValue() { // was: getValue()
    return this.value; // was: this.O
  }

  /**
   * Conditionally set or clear bit at `position`.
   * If the position has already been written, subsequent calls are ignored.
   *
   * [was: update]
   * @param {number} position - Bit position (0..31). Positions >= 32 are ignored.
   * @param {boolean} setBit - true to set, false to clear.
   */
  update(position, setBit) { // was: update(Q, c)
    if (position >= 32) return;
    if (this.written & (1 << position) && !setBit) {
      this.value &= ~(1 << position); // was: this.O &= ~(1 << Q)
    } else if (!(this.written & (1 << position)) && setBit) {
      this.value |= (1 << position); // was: this.O |= 1 << Q
    }
    this.written |= (1 << position); // was: this.W |= 1 << Q
  }
}

// =========================================================================
// MediaViewabilityTracker   [was: TbX, lines 59618-59654]
// =========================================================================

/**
 * Accumulates per-session media viewability metrics across sampling ticks.
 * Tracks total visible time, audible-and-visible time, volume range,
 * fullscreen duration, and per-second bitmask snapshots.
 *
 * Extends lB0 (base viewability accumulator).
 *
 * [was: TbX]
 */
export class MediaViewabilityTracker extends SurveyRendererMetadata { // was: TbX extends lB0
  constructor() {
    super();

    /** @type {cj} Generic time accumulator [was: this.A] */
    this.activeTimeAccum = new cj(); // was: this.A

    /** @type {number} Total time with >= 50% visible & audible [was: this.T2] */
    this.audibleVisibleTime = 0; // was: this.T2

    /** @type {number} Total audible-and-viewable time [was: this.Y] */
    this.audibleViewableTime = 0; // was: this.Y

    /** @type {number} Pause accumulator [was: this.PA] */
    this.pauseAccum = 0; // was: this.PA

    /** @type {number} Last processed time (-1 = unset) [was: this.L] */
    this.lastTime = -1; // was: this.L

    /** @type {cj} Visibility time accumulator [was: this.Y0] */
    this.visibilityTimeAccum = new cj(); // was: this.Y0

    /** @type {cj} Viewable+audible time accumulator [was: this.K] */
    this.viewableAudibleAccum = new cj(); // was: this.K

    /** @type {AdHoverTextButtonMetadata} Detailed viewability stats [was: this.W] */
    this.detailedStats = new AdHoverTextButtonMetadata(); // was: this.W

    /** @type {number} Minimum volume (-1 = unset) [was: this.j] */
    this.minVolume = -1; // was: this.j

    /** @type {number} Maximum volume [was: this.D] */
    this.maxVolume = -1; // was: this.D

    /** @type {cj} Fullscreen time accumulator [was: this.mF] */
    this.fullscreenTimeAccum = new cj(); // was: this.mF

    /** @type {number} Threshold in ms for viewability credit (2000ms) [was: this.JJ] */
    this.viewabilityThresholdMs = 2000; // was: this.JJ

    /** @type {BitmaskAccumulator} Per-second visible bitmask [was: this.MM] */
    this.visibleBitmask = new BitmaskAccumulator(); // was: this.MM (new IB)

    /** @type {BitmaskAccumulator} Per-second half-area bitmask [was: this.HA] */
    this.halfAreaBitmask = new BitmaskAccumulator(); // was: this.HA (new IB)

    /** @type {BitmaskAccumulator} Per-second audible bitmask [was: this.XI] */
    this.audibleBitmask = new BitmaskAccumulator(); // was: this.XI (new IB)
  }

  /**
   * Accumulate metrics for the current sampling tick.
   *
   * [was: update]
   * @param {number} deltaMs - Elapsed time since last tick [was: Q]
   * @param {Object} mediaState - Current media state [was: c]
   * @param {Object} viewportState - Current viewport/viewability state [was: W]
   * @param {boolean} isMultiView - Whether multiple views are active [was: m]
   */
  update(deltaMs, mediaState, viewportState, isMultiView) { // was: update(Q, c, W, m)
    if (mediaState.paused) return;

    super.update(deltaMs, mediaState, viewportState, isMultiView);

    const isAudible = vN(mediaState) && vN(viewportState); // was: K
    const isHalfVisible = (isMultiView // was: T
      ? Math.min(mediaState.hA, viewportState.hA)
      : viewportState.hA) >= 0.5;

    if (k8(mediaState.volume)) {
      this.minVolume = this.minVolume !== -1
        ? Math.min(this.minVolume, mediaState.volume)
        : mediaState.volume; // was: this.j
      this.maxVolume = Math.max(this.maxVolume, mediaState.volume); // was: this.D
    }

    if (isHalfVisible) {
      this.audibleVisibleTime += deltaMs; // was: this.T2 += Q
      this.audibleViewableTime += isAudible ? deltaMs : 0; // was: this.Y += K ? Q : 0
    }

    this.detailedStats.update(mediaState.hA, viewportState.hA, mediaState.W, deltaMs, isMultiView, isAudible); // was: this.W.update(...)
    this.activeTimeAccum.update(true, deltaMs); // was: this.A.update(!0, Q)
    this.viewableAudibleAccum.update(isAudible, deltaMs); // was: this.K.update(K, Q)
    this.fullscreenTimeAccum.update(viewportState.fullscreen, deltaMs); // was: this.mF.update(W.fullscreen, Q)
    this.visibilityTimeAccum.update(isAudible && !isHalfVisible, deltaMs); // was: this.Y0.update(K && !T, Q)

    const secondIndex = Math.floor(mediaState.mediaTime / 1000); // was: Q = Math.floor(c.mediaTime / 1E3)
    this.visibleBitmask.update(secondIndex, mediaState.isVisible()); // was: this.MM.update(Q, c.isVisible())
    this.halfAreaBitmask.update(secondIndex, mediaState.hA >= 1); // was: this.HA.update(Q, c.hA >= 1)
    this.audibleBitmask.update(secondIndex, vN(mediaState)); // was: this.XI.update(Q, vN(c))
  }
}

// =========================================================================
// ViewabilityCondition   [was: ov7, lines 59656-59666]
// =========================================================================

/**
 * Base class for a single viewability condition check with short-circuit.
 * Once `.isSatisfied` becomes true, no further checks are performed.
 *
 * [was: ov7]
 */
export class ViewabilityCondition { // was: ov7
  constructor() {
    /** @type {boolean} Whether this condition has been satisfied [was: this.K] */
    this.isSatisfied = false; // was: this.K
  }

  /**
   * Evaluate the condition against the current session state.
   *
   * [was: O]
   * @param {Object} session - Current ad viewability session [was: Q]
   */
  evaluate(session) { // was: O(Q)
    if (this.isSatisfied) return;

    if (this.check(session)) { // was: this.W(Q)
      const result = qj(this.thresholds, this.metric, session); // was: qj(this.Y, this.A, Q)
      this.accumulator |= result; // was: this.j |= Q
      this.isSatisfied = (result === 0); // was: this.K = Q
    } else {
      this.isSatisfied = false;
    }
  }
}

// =========================================================================
// MetricCondition   [was: X_, lines 59668-59692]
// =========================================================================

/**
 * Named viewability metric condition with identifier and string encoding.
 * Extends ViewabilityCondition with metric lookup, threshold reference,
 * and a `.toString()` that encodes the current state.
 *
 * [was: X_]
 */
export class MetricCondition extends ViewabilityCondition { // was: X_ extends ov7
  /**
   * @param {*} metric - The metric function/key [was: Q]
   * @param {*} thresholds - The threshold configuration [was: c]
   */
  constructor(metric, thresholds) { // was: constructor(Q, c)
    super();

    /** @type {*} Metric reference [was: this.A] */
    this.metric = metric; // was: this.A

    /** @type {*} Threshold configuration [was: this.Y] */
    this.thresholds = thresholds; // was: this.Y

    /** @type {number} Accumulated result bitmask [was: this.j] */
    this.accumulator = 0; // was: this.j
  }

  /**
   * Default condition check -- always passes.
   * [was: W]
   * @returns {boolean}
   */
  check() { // was: W()
    return true;
  }

  /**
   * Whether this is a custom metric.
   * [was: D]
   * @returns {boolean}
   */
  isCustom() { // was: D()
    return false;
  }

  /**
   * Returns the metric identifier string.
   * [was: getId]
   * @returns {string}
   */
  getId() { // was: getId()
    const index = Ga(c5, item => item === this.metric); // was: Ga(c5, c => c == this.A)
    return Hs[index].toString();
  }

  /**
   * Encode current condition state as a compact string.
   * [was: toString]
   * @returns {string}
   */
  toString() { // was: toString()
    let suffix = ""; // was: Q
    if (this.isCustom()) suffix += "c"; // was: this.D()
    if (this.isSatisfied) suffix += "s"; // was: this.K
    if (this.accumulator > 0) suffix += `:${this.accumulator}`; // was: this.j
    return this.getId() + suffix;
  }
}

// =========================================================================
// MetricConditionWithHistory   [was: rOK, lines 59694-59703]
// =========================================================================

/**
 * Metric condition that also records a history of parameter values.
 *
 * [was: rOK]
 */
export class MetricConditionWithHistory extends MetricCondition { // was: rOK extends X_
  /**
   * @param {*} metric [was: Q]
   * @param {*} thresholds [was: c]
   */
  constructor(metric, thresholds) { // was: constructor(Q, c)
    super(metric, thresholds);

    /** @type {Array} History of parameter values [was: this.J] */
    this.history = []; // was: this.J
  }

  /**
   * Evaluate with optional parameter to record.
   * [was: O]
   * @param {Object} session [was: Q]
   * @param {*} [param=null] - Optional parameter to record [was: c]
   */
  evaluate(session, param = null) { // was: O(Q, c=null)
    if (param != null) this.history.push(param); // was: c != null && this.J.push(c)
    super.evaluate(session);
  }
}

// =========================================================================
// MetricProviderBase / NoOpMetricProvider   [was: Uhn, AU, lines 59705-59715]
// =========================================================================

/**
 * Abstract base class for metric providers.
 * [was: Uhn]
 */
export class MetricProviderBase {} // was: Uhn

/**
 * No-op metric provider returning null/empty. Used as a default
 * when no real provider is configured.
 *
 * [was: AU]
 */
export class NoOpMetricProvider extends MetricProviderBase { // was: AU extends Uhn
  /**
   * Returns the primary metric (null = none).
   * [was: O]
   * @returns {null}
   */
  getPrimary() { // was: O()
    return null;
  }

  /**
   * Returns additional metrics (empty array = none).
   * [was: A]
   * @returns {Array}
   */
  getSecondary() { // was: A()
    return [];
  }
}

// =========================================================================
// ElementGeometryObserver   [was: et, lines 59717-59795]
// =========================================================================

/**
 * Observes the geometry of a DOM element relative to the viewport, computing
 * bounding rectangles, visible area, and viewport intersection ratios.
 * Used by Active-View to determine whether an ad is on-screen.
 *
 * Extends aBm (abstract element observer).
 *
 * [was: et]
 */
export class ElementGeometryObserver extends ElementObserver { // was: et extends aBm
  /**
   * Recalculate the element's bounding rectangle in viewport coordinates.
   * [was: MM]
   */
  recalculateBounds() { // was: MM()
    if (!this.element) return;

    let elementRect; // was: Q -> m
    const doc = this.provider.context.rootDocument; // was: c = this.O.W.A

    try {
      try {
        elementRect = JF(this.element.getBoundingClientRect()); // was: W = JF(Q.getBoundingClientRect())
      } catch (_e) {
        elementRect = new reportTelemetry(0, 0, 0, 0); // was: W = new PB(0,0,0,0)
      }

      const width = elementRect.right - elementRect.left; // was: K
      const height = elementRect.bottom - elementRect.top; // was: T
      const offset = rf(this.element, doc); // was: r
      const offsetX = offset.x; // was: U
      const offsetY = offset.y; // was: I

      elementRect = new reportTelemetry(
        Math.round(offsetY),
        Math.round(offsetX + width),
        Math.round(offsetY + height),
        Math.round(offsetX)
      ); // was: m
    } catch (_e) {
      elementRect = zfy.clone(); // was: m = zfy.clone()
    }

    this.boundingRect = elementRect; // was: this.A = m
    this.visibleRect = Iw(this, this.boundingRect); // was: this.W = Iw(this, this.A)
  }

  /**
   * Update the viewport reference rectangle from the provider's context.
   * [was: XI]
   */
  updateViewport() { // was: XI()
    this.viewportRect = this.provider.viewport.bounds; // was: this.S = this.O.j.W
  }

  /**
   * Determine whether the given rectangle should be treated as obscured.
   * [was: JJ]
   * @param {PB} rect [was: Q]
   * @returns {boolean}
   */
  isObscured(rect) { // was: JJ(Q)
    const isOverlayDismissed = VA(this.yE, "od") === 1; // was: c
    return X07(rect, this.viewportRect, this.element, isOverlayDismissed);
  }

  /**
   * Update the timestamp.
   * [was: HA]
   */
  updateTimestamp() { // was: HA()
    this.timestamp = Date.now() - adTimingStart;
  }

  /**
   * Full geometry update: timestamp, bounds, video sizing, viewport intersection.
   * [was: K]
   */
  fullUpdate() { // was: K()
    this.updateTimestamp();
    this.recalculateBounds();

    // Adjust visible rect for video aspect ratio
    if (
      this.element &&
      typeof this.element.videoWidth === "number" &&
      typeof this.element.videoHeight === "number"
    ) {
      const createDatabaseDefinition = this.element; // was: Q
      const videoSize = new g.JP(createDatabaseDefinition.videoWidth, createDatabaseDefinition.videoHeight); // was: c
      let visRect = this.visibleRect; // was: Q (reused)
      let visWidth = lI(visRect); // was: W
      let visHeight = visRect.getHeight(); // was: m
      const vidW = videoSize.width; // was: K
      const vidH = videoSize.height; // was: c (reused)

      if (vidW > 0 && vidH > 0 && visWidth > 0 && visHeight > 0) {
        const videoAspect = vidW / vidH; // was: K
        const rectAspect = visWidth / visHeight; // was: c
        let cloned = visRect.clone(); // was: Q

        if (videoAspect > rectAspect) {
          const fitHeight = visWidth / videoAspect; // was: W
          const margin = (visHeight - fitHeight) / 2; // was: m
          if (margin > 0) {
            const newTop = cloned.top + margin; // was: m
            cloned.top = Math.round(newTop);
            cloned.bottom = Math.round(newTop + fitHeight);
          }
        } else {
          const fitWidth = visHeight * videoAspect; // was: m
          const margin = Math.round((visWidth - fitWidth) / 2); // was: W
          if (margin > 0) {
            const newLeft = cloned.left + margin; // was: W
            cloned.left = Math.round(newLeft);
            cloned.right = Math.round(newLeft + fitWidth);
          }
        }

        this.visibleRect = cloned; // was: this.W = Q
      }
    }

    this.updateViewport();

    // Compute intersection with viewport
    let visRect = this.visibleRect; // was: Q
    let viewRect = this.viewportRect; // was: W

    let intersection =
      visRect.left <= viewRect.right &&
      viewRect.left <= visRect.right &&
      visRect.top <= viewRect.bottom &&
      viewRect.top <= visRect.bottom
        ? new reportTelemetry(
            Math.max(visRect.top, viewRect.top),
            Math.min(visRect.right, viewRect.right),
            Math.min(visRect.bottom, viewRect.bottom),
            Math.max(visRect.left, viewRect.left)
          )
        : new reportTelemetry(0, 0, 0, 0); // was: Q

    const clampedIntersection =
      intersection.top >= intersection.bottom || intersection.left >= intersection.right
        ? new reportTelemetry(0, 0, 0, 0)
        : intersection; // was: W

    const provider = this.provider.viewport; // was: Q (reused as provider ref)
    let areaRatio = 0; // was: m
    let viewportRatio = 0; // was: K
    let screenRatio = 0; // was: c

    const elementArea = (this.visibleRect.bottom - this.visibleRect.top) *
      (this.visibleRect.right - this.visibleRect.left);

    if (elementArea > 0) {
      if (this.isObscured(clampedIntersection)) {
        // intersection zeroed when obscured
      } else {
        const screenInfo = Y8().viewport; // was: m = Y8().j
        const screenRect = new reportTelemetry(0, screenInfo.height, screenInfo.width, 0); // was: c
        areaRatio = L4(clampedIntersection, this.overrideBounds ?? this.visibleRect); // was: m = L4(W, this.L ?? this.W)
        viewportRatio = L4(clampedIntersection, Y8().bounds); // was: K = L4(W, Y8().W)
        screenRatio = L4(clampedIntersection, screenRect); // was: c = L4(W, c)
      }
    }

    const localIntersection =
      clampedIntersection.top >= clampedIntersection.bottom ||
      clampedIntersection.left >= clampedIntersection.right
        ? new reportTelemetry(0, 0, 0, 0)
        : hA(clampedIntersection, -this.visibleRect.left, -this.visibleRect.top); // was: W

    if (!WN()) {
      viewportRatio = 0;
      areaRatio = 0;
    }

    this.snapshot = new ViewabilityState(
      provider, this.element, this.visibleRect, localIntersection,
      areaRatio, viewportRatio, this.timestamp, screenRatio
    ); // was: this.Ka = new OPx(...)
  }

  /**
   * Returns the name of the measurement provider.
   * [was: getName]
   * @returns {string}
   */
  getName() { // was: getName()
    return this.provider.getName();
  }
}

// =========================================================================
// NativeElementObserver   [was: Xyd, lines 59798-59825]
// =========================================================================

/**
 * Element observer for native bridge environments (Android/iOS WebView).
 * Overrides timestamp/bounds updates to be provided by the native layer.
 *
 * [was: Xyd]
 */
export class NativeElementObserver extends ElementGeometryObserver { // was: Xyd extends et
  /**
   * @param {Object} provider [was: Q]
   * @param {*} config [was: c]
   * @param {*} context [was: W]
   */
  constructor(provider, config, context) { // was: constructor(Q, c, W)
    super(null, provider, config, context);

    /** @type {boolean} Whether the provider is currently active [was: this.T2] */
    this.isActive = provider.isActive(); // was: this.T2

    /** @type {number} Native callback count [was: this.b0] */
    this.nativeCallbackCount = 0; // was: this.b0
  }

  /**
   * Begin observing -- triggers an immediate update.
   * [was: observe]
   * @returns {boolean}
   */
  observe() { // was: observe()
    this.queryNative(); // was: this.j()
    return true;
  }

  /**
   * Perform a full geometry update (called from native layer).
   * [was: D]
   */
  nativeUpdate() { // was: D()
    super.fullUpdate(); // was: super.K()
  }

  /** @override -- native handles timestamps [was: HA] */
  updateTimestamp() {} // was: HA() {}

  /** @override -- native handles bounds [was: MM] */
  recalculateBounds() {} // was: MM() {}

  /**
   * Full update including native query.
   * [was: K]
   */
  fullUpdate() { // was: K()
    this.queryNative(); // was: this.j()
    super.fullUpdate();
  }

  /**
   * Handle provider activation state changes.
   * [was: mF]
   * @param {Object} provider [was: Q]
   */
  handleActivationChange(provider) { // was: mF(Q)
    const nowActive = provider.isActive(); // was: Q = Q.isActive()
    if (nowActive !== this.isActive) {
      if (nowActive) {
        this.queryNative(); // was: this.j()
      } else {
        Y8().bounds = new reportTelemetry(0, 0, 0, 0); // was: Y8().W = new PB(0,0,0,0)
        this.visibleRect = new reportTelemetry(0, 0, 0, 0); // was: this.W = new PB(0,0,0,0)
        this.viewportRect = new reportTelemetry(0, 0, 0, 0); // was: this.S = new PB(0,0,0,0)
        this.timestamp = -1;
      }
    }
    this.isActive = nowActive; // was: this.T2 = Q
  }
}

// =========================================================================
// VideoQuartileNames   [was: FpK, lines 59827-59832]
// =========================================================================

/**
 * Map of video quartile names to numeric indices.
 * [was: FpK]
 */
export const VIDEO_QUARTILE_NAMES = { // was: FpK
  firstquartile: 0,
  midpoint: 1,
  thirdquartile: 2,
  complete: 3,
};

// =========================================================================
// ViewabilitySessionBase   [was: MtR, lines 59232-59375]
// =========================================================================

/**
 * Base class for viewability measurement sessions.
 *
 * Tracks an ad element's on-screen position, opacity, visibility state,
 * and accumulated viewability metrics over time. Extends Disposable to
 * clean up mouse-event listeners and child observers on teardown.
 *
 * Subclasses (e.g. AdViewabilitySession) add duration tracking, quartile
 * progress, and condition evaluation on top of this frame-level base.
 *
 * [was: MtR]
 */
export class ViewabilitySessionBase extends Disposable { // was: MtR extends g.qK
  constructor(config, startTime) { // was: Q, c
    super();
    this.position = reportTelemetry(0, 0, 0, 0).clone(); // was: CuO.clone() — zero rect
    this.BL = this.sT();
    this.Ad = -2;
    this.timeCreated = Date.now();
    this.hc = -1;
    this.gW = startTime;                   // was: c
    this.uT = null;
    this.Jw = false;
    this.aC = null;
    this.opacity = -1;
    this.requestSource = 7;
    this.d$ = false;
    this.Cc = () => {};
    this.nE = () => {};
    this.xc = {};                          // was: new v6m (element-time tracker)
    this.xc.KI = config;
    this.xc.W = config;
    this.w9 = false;
    this.vS = { H8: null, gy: null };      // mouse-event handler slots
    this.Sx = true;
    this.Gt = null;
    this.K4 = this.kY = false;
    this.Aj = this.LN();
    this.yR = -1;
    this.g6 = null;
    this.hasCompleted = this.uH = false;
    this.yE = {};                          // was: new sDy (feature-flag store)
  }

  /** Dispose: remove mouse listeners and child disposables. [was: WA] */
  WA() {
    if (this.xc.W) {
      if (this.vS.H8) {
        const el = this.xc.W;
        typeof el.removeEventListener === "function" &&
          el.removeEventListener("mouseover", this.vS.H8);
        this.vS.H8 = null;
      }
      if (this.vS.gy) {
        const el = this.xc.W;
        typeof el.removeEventListener === "function" &&
          el.removeEventListener("mouseout", this.vS.gy);
        this.vS.gy = null;
      }
    }
    this.Gt && this.Gt.dispose();
    this.g6 && this.g6.dispose();
    delete this.BL;
    delete this.Cc;
    delete this.nE;
    delete this.xc.KI;
    delete this.xc.W;
    delete this.vS;
    delete this.Gt;
    delete this.g6;
    delete this.yE;
    super.WA();
  }

  /** Current position (possibly animated). [was: o4] */
  o4() { return this.g6 ? this.g6.W : this.position; }

  /** Report viewability event. [was: lq] */
  lq(value) { /* rs().lq(value) */ }

  /** Whether rendering is active. [was: Rw] */
  Rw() { return false; }

  /** Create layout tracker. [was: sT] */
  sT() { return {}; /* was: new lB0 */ }

  /** Return layout tracker. [was: ZQ] */
  ZQ() { return this.BL; }

  /** Create visibility observation record. [was: LN] */
  LN() { return {}; /* was: new FQ7 */ }

  /** Clamp visibility to 0 when opacity is 0. [was: cV] */
  cV(visibility) {
    return this.opacity === 0 ? 0 : visibility;
  }

  /** Whether element is in "large" mode. [was: M8] */
  M8() { return false; }

  /** Whether session has ended or been dismissed. [was: vt] */
  vt() { return this.uH || this.kY; }

  /** Get request source. [was: Gl] */
  Gl() { return this.requestSource; }

  /** Supplemental metric. [was: uB] */
  uB() { return 0; }

  /** Whether viewability threshold reached. [was: wN] */
  wN() { return this.BL.wN(); }

  /** Supplemental metric. [was: qN] */
  qN() { return 0; }
}

// =========================================================================
// AdViewabilitySession   [was: AO_, lines 59833-59960]
// =========================================================================

/**
 * Represents a full ad viewability tracking session. Manages duration,
 * viewability flags, interaction events, quartile progress, and metric
 * conditions for a single ad impression.
 *
 * Extends ViewabilitySessionBase [was: MtR].
 *
 * [was: AO_]
 */
export class AdViewabilitySession extends ViewabilitySessionBase { // was: AO_ extends MtR
  /**
   * @param {*} config [was: Q]
   * @param {number} startTime [was: c]
   * @param {*} flagMapper [was: W]
   * @param {NoOpMetricProvider} [metricProvider=new NoOpMetricProvider()] [was: m]
   */
  constructor(config, startTime, flagMapper, metricProvider = new NoOpMetricProvider()) { // was: constructor(Q, c, W, m=new AU)
    super(config, startTime);

    /** @type {*} Flag mapper for encoding pings [was: this.Dt] */
    this.flagMapper = flagMapper; // was: this.Dt

    /** @type {number} Ping counter [was: this.Tl] */
    this.pingCount = 0; // was: this.Tl

    /** @type {Object} User interaction event map [was: this.UV] */
    this.interactionEvents = {}; // was: this.UV

    /** @type {ViewabilityBitmask} Current viewability bitmask [was: this.cj] */
    this.viewabilityBitmask = new ViewabilityBitmask(); // was: this.cj = new KVn()

    /** @type {Object} Custom metric results [was: this.WU] */
    this.customMetrics = {}; // was: this.WU

    /** @type {string} Session query ID [was: this.i9] */
    this.queryId = ""; // was: this.i9

    /** @type {?Object} Optional host adapter [was: this.HA] */
    this.hostAdapter = null; // was: this.HA

    /** @type {boolean} Fullscreen state cached [was: this.Fw] */
    this.isFullscreen = false; // was: this.Fw

    /** @type {Array} Condition trackers [was: this.W] */
    this.conditions = []; // was: this.W

    /** @type {?Object} Primary measurable condition [was: this.pA] */
    this.measurableCondition = metricProvider.getPrimary(); // was: this.pA = m.O()

    /** @type {Array} Secondary conditions [was: this.D] */
    this.secondaryConditions = metricProvider.getSecondary(); // was: this.D = m.A()

    /** @type {?string} Slot type [was: this.j] */
    this.slotType = null; // was: this.j

    /** @type {number} Duration in ms (-1 = unknown) [was: this.A] */
    this.duration = -1; // was: this.A

    /** @type {undefined|boolean} Is VPAID ad [was: this.mF] */
    this.isVpaid = undefined; // was: this.mF

    /** @type {undefined|boolean} Is YouTube-hosted ad [was: this.PA] */
    this.isYouTube = undefined; // was: this.PA

    /** @type {number} Secondary counter [was: this.b0] */
    this.secondaryCounter = 0; // was: this.b0

    /** @type {number} State counter [was: this.S] */
    this.stateCounter = 0; // was: this.S

    /** @type {number} Midpoint timestamp (-1 = unset) [was: this.MM] */
    this.midpointTimestamp = -1; // was: this.MM

    /** @type {boolean} Midpoint reached flag [was: this.JJ] */
    this.midpointReached = false; // was: this.JJ

    /** @type {boolean} Lazy-load flag [was: this.La] */
    this.isAudibleAndViewable = false; // was: this.La

    /** @type {number} Error code tracking [was: this.EC] */
    this.volumeErrorCount = 0; // was: this.EC

    /** @type {number} Config error code [was: this.jC] */
    this.configError = 0; // was: this.jC

    /** @type {number} Error tracking [was: this.O] */
    this.metadataError = 0; // was: this.O

    /** @type {number} Field-missing bitmask [was: this.Y] */
    this.fieldMissingMask = 0; // was: this.Y

    /** @type {number} Metadata error code [was: this.Ie] */
    this.metadataErrorCode = 0; // was: this.Ie

    new AdHoverTextButtonMetadata(); // (unused, presumably for side-effect)

    /** @type {number} User-interaction hash [was: this.UH] */
    this.interactionHash = 0; // was: this.UH

    /** @type {number} Snapshot counter [was: this.Ka] */
    this.snapshotCounter = 0; // was: this.Ka

    /** @type {number} Visibility index (-1 = unset) [was: this.XI] */
    this.visibilityIndex = -1; // was: this.XI

    /** @type {number} Playback state tracker [was: this.uy] */
    this.playbackState = 0; // was: this.uy

    /** @type {Function} Metadata fetcher [was: this.L] */
    this.metadataFetcher = g.vB; // was: this.L

    /** @type {Array<MediaViewabilityTracker>} Per-period trackers [was: this.T2] */
    this.periodTrackers = [this.createPeriodTracker()]; // was: this.T2 = [this.sT()]

    /** @type {number} Impression index [was: this.iX] */
    this.impressionIndex = 2; // was: this.iX

    /**
     * User action label map.
     * [was: this.Lg]
     * @type {Object<string, string>}
     */
    this.actionLabels = {}; // was: this.Lg
    this.actionLabels.pause = "p";
    this.actionLabels.resume = "r";
    this.actionLabels.skip = "s";
    this.actionLabels.mute = "m";
    this.actionLabels.unmute = "um";
    this.actionLabels.exitfullscreen = "ef";

    /** @type {?PB} Cached bounding rect [was: this.K] */
    this.cachedRect = null; // was: this.K

    /** @type {boolean} Audio was audible at start [was: this.Re] */
    this.wasAudibleAtStart = false; // was: this.Re

    /** @type {boolean} TV-off state [was: this.Y0] */
    this.isTvOff = false; // was: this.Y0

    /** @type {number} Wall-clock base (seconds since 2024-01-01) [was: this.WB] */
    this.wallClockBase = Math.floor(Date.now() / 1000 - 1704067200); // was: this.WB

    /** @type {number} Gesture counter [was: this.jG] */
    this.gestureCount = 0; // was: this.jG
  }

  /**
   * Whether this session reports viewability.
   * [was: Rw]
   * @returns {boolean}
   */
  reportsViewability() { // was: Rw()
    return true;
  }

  /**
   * Whether the session is currently paused.
   * [was: Ap]
   * @returns {boolean}
   */
  isPaused() { // was: Ap()
    return this.playbackState === 2; // was: this.uy == 2
  }

  /**
   * Check if a ping boundary has been crossed.
   * [was: BH]
   * @param {number} timestamp [was: Q]
   * @returns {boolean}
   */
  checkPingBoundary(timestamp) { // was: BH(Q)
    return g9(this, timestamp, Math.max(10000, this.duration / 3));
  }

  /**
   * Begin tracking -- wires up metadata, flags, and optional plugin conditions.
   * [was: ZF]
   */
  beginTracking(config, startTime, flagMapper, isMultiView, metadata, threshold, rawConfig) {
    // was: ZF(Q, c, W, m, K, T, r)
    const resolved = this.metadataFetcher(this) || {}; // was: U = this.L(this) || {}
    extendObject(resolved, metadata); // was: g.JH(U, K)
    this.duration = resolved.duration || this.duration; // was: this.A = U.duration || this.A
    this.isVpaid = resolved.isVpaid || this.isVpaid; // was: this.mF = U.isVpaid || this.mF
    this.isYouTube = resolved.isYouTube || this.isYouTube; // was: this.PA = U.isYouTube || this.PA

    bj();
    this.isTvOff = false; // was: this.Y0 = !1

    const derivedThreshold = tfX(this, startTime); // was: K = tfX(this, c)
    if (MK(this) === 1) threshold = derivedThreshold; // was: MK(this) === 1 && (T = K)

    super.QUALITY_LABELS_DESCENDING(config, startTime, flagMapper, isMultiView, resolved, threshold, rawConfig);

    if (this.measurableCondition?.isSatisfied) {
      forEach(this.secondaryConditions, condition => {
        condition.evaluate(this); // was: I.O(this)
      });
    }
  }

  /**
   * Per-tick update -- accumulates viewability metrics.
   * [was: i5]
   */
  tickUpdate(deltaMs, mediaState, viewportState) { // was: i5(Q, c, W)
    super.getErrorSampler(deltaMs, mediaState, viewportState);
    Jf(this).update(deltaMs, mediaState, this.Aj, viewportState);

    this.isAudibleAndViewable = vN(this.Aj) && vN(mediaState); // was: this.La
    if (this.midpointTimestamp === -1 && this.midpointReached) {
      this.midpointTimestamp = this.ZQ().activeTimeAccum.accumulation; // was: this.MM = this.ZQ().A.W
    }

    this.viewabilityBitmask.cumulativeMask = 0; // was: this.cj.A = 0

    const isViewable = this.wN(); // was: Q = this.wN()
    if (mediaState.isVisible()) GR(this.viewabilityBitmask, "vs");
    if (isViewable) GR(this.viewabilityBitmask, "vw");
    if (k8(mediaState.volume)) GR(this.viewabilityBitmask, "am");
    if (vN(mediaState)) {
      GR(this.viewabilityBitmask, "a");
    } else {
      GR(this.viewabilityBitmask, "mut");
    }
    if (this.K4) GR(this.viewabilityBitmask, "f");
    if (mediaState.O !== -1) {
      GR(this.viewabilityBitmask, "bm");
      if (mediaState.O === 1) {
        GR(this.viewabilityBitmask, "b");
        if (vN(mediaState)) GR(this.viewabilityBitmask, "umutb");
      }
    }
    if (vN(mediaState) && mediaState.isVisible()) GR(this.viewabilityBitmask, "avs");
    if (this.isAudibleAndViewable && isViewable) GR(this.viewabilityBitmask, "avw");
    if (mediaState.hA > 0) GR(this.viewabilityBitmask, "pv");
    if (Rw(this, this.ZQ().activeTimeAccum.accumulation, true)) GR(this.viewabilityBitmask, "gdr");
    if (FR(this.ZQ().value, 1) >= 2000) GR(this.viewabilityBitmask, "pmx");
    if (this.isTvOff) GR(this.viewabilityBitmask, "tvoff");
  }

  /**
   * Create a new per-period tracker.
   * [was: sT]
   * @returns {MediaViewabilityTracker}
   */
  createPeriodTracker() { // was: sT()
    return new MediaViewabilityTracker(); // was: new TbX
  }

  /**
   * Returns the current period tracker.
   * [was: ZQ]
   * @returns {MediaViewabilityTracker}
   */
  getCurrentTracker() { // was: ZQ()
    return this.BL;
  }

  /**
   * Creates a new viewability snapshot record.
   * [was: LN]
   * @returns {RfW}
   */
  createSnapshot() { // was: LN()
    return new RfW();
  }

  /**
   * Build a state object from the current media element.
   * [was: xO]
   */
  buildState(config, viewState, mediaElement, timeOverride = -1) { // was: xO(Q, c, W, m=-1)
    const state = super.EPHEMERAL_STORE_TOKEN(config, viewState, mediaElement, timeOverride); // was: Q = super.xO(...)
    state.fullscreen = this.K4;
    state.paused = this.isPaused();
    state.volume = mediaElement.volume;

    if (!k8(state.volume)) {
      this.volumeErrorCount++;
      const previous = this.Aj;
      if (k8(previous.volume)) {
        state.volume = previous.volume;
      }
    }

    const currentTime = mediaElement.currentTime; // was: W
    state.mediaTime = currentTime !== undefined && currentTime >= 0 ? currentTime : -1;

    return state;
  }

  /**
   * Compute viewport coverage.
   * [was: cV]
   */
  getViewportCoverage(config) { // was: cV(Q)
    Y8();
    return this.K4 ? 1 : super.cV(config);
  }

  /**
   * Returns the unit type (1 = video).
   * [was: uB]
   * @returns {number}
   */
  getUnitType() { // was: uB()
    return 1;
  }

  /**
   * Returns the ad duration.
   * [was: getDuration]
   * @returns {number}
   */
  getDuration() { // was: getDuration()
    return this.duration;
  }

  /**
   * Returns the viewability state code.
   * [was: Yn]
   * @returns {number}
   */
  getViewabilityState() { // was: Yn()
    return this.wrapWithReporter ? 2 : kE(this) ? 5 : this.wN() ? 4 : 3;
  }

  /**
   * Returns the audio measurability state.
   * [was: qN]
   * @returns {number}
   */
  getAudioMeasurability() { // was: qN()
    return this.instreamAdPlayerOverlayRenderer
      ? (this.getCurrentTracker().viewableAudibleAccum.accumulation >= 2000 ? 4 : 3)
      : 2;
  }

  /**
   * Forward a bounding rect to the geometry tracker.
   * [was: J]
   * @param {PB} rect [was: Q]
   */
  forwardRect(rect) { // was: J(Q)
    if (this.g6) this.g6.J(rect);
  }
}

// =========================================================================
// FrameWalker   [was: aCn, lines 59963-59977]
// =========================================================================

/**
 * Walks the iframe hierarchy, registering each document with the
 * viewability system via `KX()`.
 *
 * [was: aCn]
 */
export class FrameWalker { // was: aCn
  constructor() {
    /** @type {Object} Registered documents map [was: this.W] */
    this.registeredDocs = {}; // was: this.W

    const currentWindow = qn(); // was: Q
    KX(this, currentWindow, document);

    const crossOriginAccess = w07(); // was: c
    try {
      if (crossOriginAccess === "1") {
        for (let frame = currentWindow.parent; frame !== currentWindow.top; frame = frame.parent) {
          KX(this, frame, frame.document);
        }
        KX(this, currentWindow.top, currentWindow.top.document);
      }
    } catch (_e) {
      // Cross-origin frame access silently fails
    }
  }
}

/** @type {number} High-resolution timestamp baseline [was: eN7] */
export const timestampBaseline = now(); // was: eN7

// =========================================================================
// EventBuffer   [was: V9y, lines 59979-59989]
// =========================================================================

/**
 * Simple double-buffer for pending/processed viewability events.
 *
 * [was: V9y]
 */
export class EventBuffer { // was: V9y
  constructor() {
    /** @type {Array} Primary event buffer [was: this.W] */
    this.primary = []; // was: this.W

    /** @type {Array} Secondary event buffer [was: this.O] */
    this.secondary = []; // was: this.O
  }

  /**
   * Clear both buffers.
   * [was: reset]
   */
  reset() { // was: reset()
    this.primary = [];
    this.secondary = [];
  }
}

/** @type {EventBuffer} Global singleton event buffer [was: rM] */
export const globalEventBuffer = gf(EventBuffer); // was: rM = gf(V9y)

// ── Lines 59990-59995 (PluginSlotHolder / t_) are in plugin-manager.js ──
// ── Lines 59996-60041 (MultiPluginManager / rPK) are in plugin-manager.js ──

// =========================================================================
// IntersectionObserver thresholds   [was: v9x, lines 60043-60045]
// =========================================================================

/**
 * Default IntersectionObserver threshold configuration.
 * [was: v9x]
 */
export const INTERSECTION_THRESHOLDS = { // was: v9x
  threshold: [0, 0.3, 0.5, 0.75, 1],
};

// =========================================================================
// IntersectionElementObserver   [was: BbK, lines 60046-60086]
// =========================================================================

/**
 * Element observer backed by IntersectionObserver. Falls back to the
 * base ElementGeometryObserver for final rectangle computation but
 * relies on IO callbacks for intersection data.
 *
 * [was: BbK]
 */
export class IntersectionElementObserver extends ElementGeometryObserver { // was: BbK extends et
  /**
   * @param {*} element [was: Q]
   * @param {*} provider [was: c]
   * @param {*} config [was: W]
   * @param {*} context [was: m]
   */
  constructor(element, provider, config, context) { // was: constructor(Q, c, W, m)
    super(element, provider, config, context);

    /** @type {?IntersectionObserver} Primary IO instance [was: this.j] */
    this.intersectionObserver = null; // was: this.j

    /** @type {?IntersectionObserver} Secondary IO instance [was: this.T2] */
    this.secondaryObserver = null; // was: this.T2

    /** @type {?MutationObserver} Mutation observer for fallback [was: this.b0] */
    this.mutationObserver = null; // was: this.b0

    /** @type {?number} Gesture counter [was: this.jG] */
    this.gestureCounter = null; // was: this.jG

    /** @type {?number} First observation timestamp [was: this.PA] */
    this.firstObservationTimestamp = null; // was: this.PA
  }

  /**
   * Begin observing the element via IntersectionObserver.
   * [was: observe]
   * @returns {boolean} true if observation started successfully
   */
  observe() { // was: observe()
    if (!this.firstObservationTimestamp) {
      this.firstObservationTimestamp = Date.now() - adTimingStart;
    }
    if (wrapWithReporter(298, () => a77(this))) return true;
    this.provider.fail("msf"); // was: this.O.fail("msf")
    return false;
  }

  /**
   * Stop observing the element.
   * [was: unobserve]
   */
  unobserve() { // was: unobserve()
    if (this.intersectionObserver && this.element) {
      try {
        this.intersectionObserver.unobserve(this.element);
        if (this.secondaryObserver) {
          this.secondaryObserver.unobserve(this.element);
          this.secondaryObserver = null;
        } else if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }
      } catch (_e) {
        // Silently handle cleanup errors
      }
    }
  }

  /**
   * Full geometry update from IO data.
   * [was: K]
   */
  fullUpdate() { // was: K()
    const entries = eq(this); // was: Q = eq(this)
    if (entries.length > 0) A_(this, entries);
    super.fullUpdate();
  }

  /** @override -- IO handles bounds [was: MM] */
  recalculateBounds() {} // was: MM() {}

  /** @override -- IO handles obscured check [was: JJ] */
  isObscured() { // was: JJ()
    return false;
  }

  /** @override -- IO handles viewport [was: XI] */
  updateViewport() {} // was: XI() {}

  /**
   * Returns debug/diagnostic info.
   * [was: G0]
   * @returns {Object}
   */
  getDiagnostics() { // was: G0()
    return Object.assign(this.provider.G0(), {
      niot_obs: this.firstObservationTimestamp,
      niot_cbk: this.gestureCounter,
    });
  }

  /**
   * Returns the measurement provider name.
   * [was: getName]
   * @returns {string}
   */
  getName() { // was: getName()
    return "nio";
  }
}

// =========================================================================
// IntersectionMeasurementProvider   [was: Ip, lines 60088-60101]
// =========================================================================

/**
 * Measurement provider that wraps IntersectionObserver.
 * Available when not in a native-bridge environment and
 * the browser supports IntersectionObserver.
 *
 * [was: Ip]
 */
export class IntersectionMeasurementProvider extends ViewabilityManager { // was: Ip extends QW
  /**
   * @param {*} [rootConfig=bI] [was: Q]
   */
  constructor(rootConfig = win) { // was: constructor(Q=bI)
    super(new MeasurementClient(rootConfig, 2));
  }

  /**
   * [was: getName]
   * @returns {string}
   */
  getName() { // was: getName()
    return "nio";
  }

  /**
   * Whether this provider is available in the current environment.
   * [was: A]
   * @returns {boolean}
   */
  isAvailable() { // was: A()
    return !Y8().isNativeBridge && this.plugin.context.rootDocument.IntersectionObserver != null;
    // was: return !Y8().O && this.W.W.A.IntersectionObserver != null
  }

  /**
   * Create an element observer instance.
   * [was: j]
   */
  createObserver(element, config, context) { // was: j(Q, c, W)
    return new IntersectionElementObserver(element, this.plugin, config, context);
    // was: return new BbK(Q, this.W, c, W)
  }
}

// =========================================================================
// GeometricMeasurementPlugin   [was: Kky, lines 60103-60118]
// =========================================================================

/**
 * Geometric (polling-based) measurement plugin. Falls back to
 * polling-based geometry calculations when IntersectionObserver
 * is unavailable or unreliable.
 *
 * [was: Kky]
 */
export class GeometricMeasurementPlugin extends MeasurementClient { // was: Kky extends pK
  constructor() {
    const priority = VG(); // was: Q
    super(win.top, priority, "geo");
  }

  /**
   * Returns the current viewport bounds.
   * [was: La]
   * @returns {PB}
   */
  getViewportBounds() { // was: La()
    return Y8().bounds; // was: Y8().W
  }

  /**
   * Check whether this plugin should be the active measurement source.
   * [was: T2]
   * @returns {boolean}
   */
  shouldBeActive() { // was: T2()
    const currentPriority = VG(); // was: Q
    if (this.priority !== currentPriority) {
      if (currentPriority > this.basePlugin.priority) {
        this.basePlugin = this; // was: this.W = this
        TR(this);
      }
      this.priority = currentPriority; // was: this.S = Q
    }
    return currentPriority === 2;
  }
}

// =========================================================================
// Misc small classes   [was: H5, xh7, lines 60120-60147]
// =========================================================================

/** Abstract hook interface. [was: H5] */
export class MeasurementHook {} // was: H5

/**
 * Periodic sampling state for viewability measurement.
 * [was: xh7]
 */
export class SamplingState { // was: xh7
  constructor() {
    /** @type {boolean} Whether sampling is complete [was: this.done] */
    this.done = false; // was: this.done = !1

    /**
     * Sampling counters.
     * [was: this.W]
     * @type {Object}
     */
    this.counters = { // was: this.W
      squeezebackSidePanel: 0,
      f5: 0,
      Ir2: 0,
      f0: 0,
      queryDataHas: -1,
      lK: 0,
      Jo: 0,
      sI: 0,
      xT: 0,
    };

    /** @type {?Object} Associated session [was: this.j] */
    this.session = null; // was: this.j

    /** @type {boolean} Is first sample [was: this.K] */
    this.isFirstSample = false; // was: this.K

    /** @type {?Object} Previous state [was: this.A] */
    this.previousState = null; // was: this.A

    /** @type {number} Sample counter [was: this.D] */
    this.sampleCount = 0; // was: this.D

    /** @type {vpn} Observer instance [was: this.O] */
    this.observer = new ScheduledSampler(this); // was: this.O = new vpn(this)
  }

  /**
   * Take a sample.
   * [was: sample]
   */
  sample() { // was: sample()
    xk(this, UW(), false); // was: xk(this, UW(), !1)
  }
}

/** @type {SamplingState} Global singleton sampling state [was: nX] */
export const globalSamplingState = gf(SamplingState); // was: nX = gf(xh7)

// =========================================================================
// SDK identification   [was: lines 60148-60198]
// =========================================================================

/** @type {?Object} Cached detection result [was: Sq] */
let cachedDetection = null; // was: Sq

/** @type {string} Version string cache [was: V7] */
let versionCache = ""; // was: V7

/** @type {boolean} Event-sent flag [was: ev] */
let eventSent = false; // was: ev

/**
 * Detect which SDK environment is hosting the player.
 * Returns an object with `{ sdkType, sdkVersion }`.
 *
 * [was: qXm]
 * @returns {{ sdkType: string, sdkVersion: ?string }}
 */
export const detectSdk = () => { // was: qXm
  if ("av.default_js".includes("ima_html5_sdk")) return { sdkType: "ima", sdkVersion: null };
  if ("av.default_js".includes("ima_native_sdk")) return { sdkType: "nima", sdkVersion: null };
  if ("av.default_js".includes("admob-native-video-javascript")) return { sdkType: "an", sdkVersion: null };
  if ("youtube.player.web_20260324_03_RC00".includes("cast_js_sdk")) return { sdkType: "cast", sdkVersion: FH() };
  if ("youtube.player.web_20260324_03_RC00".includes("youtube.player.web")) return { sdkType: "yw", sdkVersion: FH() };
  if ("youtube.player.web_20260324_03_RC00".includes("outstream_web_client")) return { sdkType: "out", sdkVersion: FH() };
  if ("youtube.player.web_20260324_03_RC00".includes("drx_rewarded_web")) return { sdkType: "r", sdkVersion: FH() };
  if ("youtube.player.web_20260324_03_RC00".includes("gam_native_web_video")) return { sdkType: "n", sdkVersion: FH() };
  if ("youtube.player.web_20260324_03_RC00".includes("admob_interstitial_video")) return { sdkType: "int", sdkVersion: FH() };
  return { sdkType: "j", sdkVersion: null };
};
// was: qXm = () => "av.default_js".includes("ima_html5_sdk") ? { Iw: "ima", zR: null } : ...

/** @type {string} Current SDK type string [was: t3] */
export const currentSdkType = detectSdk().sdkType; // was: t3 = qXm().Iw

/** @type {?string} Current SDK version [was: aS] */
export const currentSdkVersion = detectSdk().sdkVersion; // was: aS = qXm().zR

/**
 * Build a logging metadata object for a viewability ping.
 *
 * [was: Fl]
 * @param {string} message - Ping message/type [was: Q]
 * @param {string} [metricName] - Optional metric name [was: c]
 * @returns {Object}
 */
export const buildPingMetadata = (message, metricName) => { // was: Fl
  const meta = { sv: "968" }; // was: W
  if (currentSdkVersion !== null) meta.v = currentSdkVersion; // was: aS !== null && (W.v = aS)
  meta.cb = currentSdkType; // was: W.cb = t3
  meta.nas = globalEventBuffer.primary.length; // was: W.nas = rM.W.length
  meta.msg = message; // was: W.msg = Q
  if (metricName !== undefined) {
    const index = lookupMetricIndex(metricName); // was: Q = Zx(c)
    if (index) meta.e = Hs[index]; // was: Q && (W.e = Hs[Q])
  }
  return meta;
};

/**
 * Look up the index for a named metric in the c5 table.
 *
 * [was: Zx]
 * @param {string} metricName [was: Q]
 * @returns {number}
 */
export const lookupMetricIndex = (metricName) => { // was: Zx
  const normalised = x9(metricName, "custom_metric_viewable")
    ? "custom_metric_viewable"
    : metricName.toLowerCase(); // was: c
  return Ga(c5, item => item === normalised); // was: Ga(c5, W => W == c)
};

// =========================================================================
// Custom metric criteria   [was: zyR, ZL, cP7, Wk7, lines 60200-60265]
// =========================================================================

/**
 * Custom metric field name mappings.
 * [was: zyR]
 */
export const CUSTOM_METRIC_FIELDS = { // was: zyR
  En: "visible",
  shouldDeferAdModule: "audible",
  PXH: "time",
  UQM: "timetype",
};

/**
 * Validators for each custom metric field.
 * [was: ZL]
 */
export const CUSTOM_METRIC_VALIDATORS = { // was: ZL
  visible: (value) => /^(100|[0-9]{1,2})$/.test(value),
  audible: (value) => value === "0" || value === "1",
  timetype: (value) => value === "mtos" || value === "tos",
  time: (value) => /^(100|[0-9]{1,2})%$/.test(value) || /^([0-9])+ms$/.test(value),
};

/**
 * Custom metric threshold configuration.
 * [was: cP7]
 */
export class CustomMetricThreshold { // was: cP7
  constructor() {
    /** @type {undefined} Visibility threshold [was: this.W] */
    this.visibilityThreshold = undefined; // was: this.W = void 0

    /** @type {boolean} Audible requirement [was: this.O] */
    this.audibleRequired = false; // was: this.O = !1

    /** @type {number} Time threshold in ms [was: this.A] */
    this.timeThresholdMs = 0; // was: this.A

    /** @type {number} Time threshold as fraction (-1 = not set) [was: this.j] */
    this.timeThresholdFraction = -1; // was: this.j

    /** @type {string} Time type ("tos" or "mtos") [was: this.K] */
    this.timeType = "tos"; // was: this.K
  }

  /**
   * Configure the time threshold.
   * [was: setTime]
   * @param {number} value [was: Q]
   * @param {string} unit - "ms" or "%" [was: c]
   * @param {string} [timeType="tos"] [was: W]
   * @returns {this}
   */
  setTime(value, unit, timeType = "tos") { // was: setTime(Q, c, W="tos")
    if (unit === "ms") {
      this.timeThresholdMs = value; // was: this.A = Q
      this.timeThresholdFraction = -1; // was: this.j = -1
    } else {
      this.timeThresholdMs = -1; // was: this.A = -1
      this.timeThresholdFraction = value; // was: this.j = Q
    }
    this.timeType = timeType; // was: this.K = W
    return this;
  }
}

/**
 * Custom-defined metric condition with user-specified thresholds.
 *
 * [was: Wk7]
 */
export class CustomMetricCondition extends MetricCondition { // was: Wk7 extends X_
  /**
   * @param {string} id - Custom metric identifier [was: Q]
   * @param {*} metric [was: c]
   * @param {Array<CustomMetricThreshold>} criteria [was: W]
   * @param {*} thresholds [was: m]
   */
  constructor(id, metric, criteria, thresholds) { // was: constructor(Q, c, W, m)
    super(metric, thresholds);

    /** @type {string} Custom identifier [was: this.J] */
    this.customId = id; // was: this.J

    /** @type {Array<CustomMetricThreshold>} Criteria list [was: this.L] */
    this.criteria = criteria; // was: this.L
  }

  /**
   * [was: getId]
   * @returns {string}
   */
  getId() { // was: getId()
    return this.customId; // was: this.J
  }

  /**
   * [was: D]
   * @returns {boolean}
   */
  isCustom() { // was: D()
    return true;
  }

  /**
   * Check whether all criteria are met.
   * [was: W]
   * @param {Object} session [was: Q]
   * @returns {boolean}
   */
  check(session) { // was: W(Q)
    const tracker = session.getCurrentTracker(); // was: c = Q.ZQ()
    const duration = session.getDuration(); // was: W = Q.getDuration()

    return Jy(this.criteria, criterion => { // was: Jy(this.L, m => { ... })
      if (criterion.visibilityThreshold !== undefined) {
        return MfX(criterion, tracker); // was: K = MfX(m, c)
      }

      // Time-based check
      let elapsed; // was: K
      switch (criterion.timeType) {
        case "mtos":
          elapsed = criterion.audibleRequired
            ? tracker.viewableAudibleAccum.accumulation
            : tracker.activeTimeAccum.accumulation;
          break;
        case "tos":
          elapsed = criterion.audibleRequired
            ? tracker.viewableAudibleAccum.total
            : tracker.activeTimeAccum.accumulation;
          break;
        default:
          elapsed = 0;
      }

      if (elapsed === 0) return false;

      const threshold = criterion.timeThresholdMs !== -1
        ? criterion.timeThresholdMs
        : (duration !== undefined && duration > 0
          ? criterion.timeThresholdFraction * duration
          : -1);

      return threshold !== -1 && elapsed >= threshold;
    });
  }
}

// =========================================================================
// Flag mapper implementations   [was: nvx, LVK, lines 60267-60663]
// =========================================================================

/**
 * Standard flag mapper for video viewability pings.
 * [was: nvx]
 */
export class StandardFlagMapper extends ViewabilityFlagMapper { // was: nvx extends mhO
  /**
   * Map ping data to viewability flags.
   * [was: W]
   * @param {Object} pingData [was: Q]
   * @returns {ViewabilityFlags}
   */
  mapFlags(pingData) { // was: W(Q)
    const flags = new ViewabilityFlags(); // was: c = new WV0()
    flags.primary = aw(pingData, DISPLAY_METRIC_KEYS); // was: c.W = aw(Q, pj3)
    flags.secondary = aw(pingData, AUDIO_SUPPLEMENTARY_KEYS); // was: c.O = aw(Q, cOO)
    return flags;
  }
}

// ── Built-in metric conditions ──

/**
 * "Fully viewable, audible, half-duration" impression condition.
 * [was: Dhw]
 */
export class FullyViewableAudibleCondition extends MetricCondition { // was: Dhw extends X_
  constructor(thresholds) { // was: constructor(Q)
    super("fully_viewable_audible_half_duration_impression", thresholds);
  }

  check(session) { // was: W(Q)
    return kE(session);
  }
}

/**
 * Metric provider bundle for the standard viewability impression.
 * [was: t9K]
 */
export class MetricProviderBundle extends MetricProviderBase { // was: t9K extends Uhn
  /**
   * @param {*} thresholds [was: Q]
   */
  constructor(thresholds) { // was: constructor(Q)
    super();
    /** @type {*} Threshold configuration [was: this.W] */
    this.thresholds = thresholds; // was: this.W
  }
}

/**
 * "Viewable impression" condition.
 * [was: HSW]
 */
export class ViewableImpressionCondition extends MetricCondition { // was: HSW extends X_
  constructor(thresholds) { // was: constructor(Q)
    super("viewable_impression", thresholds);
  }

  check(session) { // was: W(Q)
    return session.getCurrentTracker().wN(); // was: Q.ZQ().wN()
  }
}

/**
 * "Measurable impression" condition (with history).
 * [was: Nb7]
 */
export class MeasurableImpressionCondition extends MetricConditionWithHistory { // was: Nb7 extends rOK
  constructor(thresholds) { // was: constructor(Q)
    super("measurable_impression", thresholds);
  }

  check(session) { // was: W(Q)
    const ovmsParam = contains(this.history, VA(rs().yE, "ovms")); // was: c
    return !session.wrapWithReporter && (session.playbackState !== 0 || ovmsParam);
  }
}

/**
 * Standard metric provider bundle producing measurable + viewable + FVAHD conditions.
 * [was: iSy]
 */
export class StandardMetricBundle extends MetricProviderBundle { // was: iSy extends t9K
  getPrimary() { // was: O()
    return new MeasurableImpressionCondition(this.thresholds);
  }

  getSecondary() { // was: A()
    return [
      new ViewableImpressionCondition(this.thresholds),
      new FullyViewableAudibleCondition(this.thresholds),
    ];
  }
}

// ── Native bridge observers (GSV, NIS) ──

/**
 * Google Services Viewability bridge observer.
 * [was: yO3]
 */
export class GsvObserver extends NativeElementObserver { // was: yO3 extends Xyd
  queryNative() { // was: j()
    const getViewability = getObjectByPath("ima.admob.getViewability"); // was: Q
    const queryId = VA(this.yE, "queryid"); // was: c
    if (typeof getViewability === "function" && queryId) getViewability(queryId);
  }

  getName() { return "gsv"; }
}

/**
 * GSV measurement provider.
 * [was: TOO]
 */
export class GsvMeasurementProvider extends ViewabilityManager { // was: TOO extends QW
  constructor() { super(new MeasurementClient(win, 2)); }

  getName() { return "gsv"; }

  isAvailable() { // was: A()
    const env = Y8();
    rs();
    return env.isNativeBridge && false; // was: Q.O && !1
  }

  createObserver(element, config, context) { // was: j(Q, c, W)
    return new GsvObserver(this.plugin, config, context);
  }
}

/**
 * Native IMA SDK bridge observer.
 * [was: SXO]
 */
export class NisBridgeObserver extends NativeElementObserver { // was: SXO extends Xyd
  queryNative() { // was: j()
    const getNativeViewability = getObjectByPath("ima.bridge.getNativeViewability"); // was: Q
    const queryId = VA(this.yE, "queryid"); // was: c
    if (typeof getNativeViewability === "function" && queryId) {
      getNativeViewability(queryId, (result) => { // was: W => { ... }
        if (isEmptyObject(result)) this.nativeCallbackCount++;
        const visibleBounds = result.opt_nativeViewVisibleBounds || {}; // was: m
        const isHidden = result.opt_nativeViewHidden; // was: K
        this.visibleRect = Rk(result.opt_nativeViewBounds || {}); // was: this.W
        const viewport = this.provider.viewport; // was: T = this.O.j
        viewport.bounds = isHidden ? INm.clone() : Rk(visibleBounds); // was: T.W
        this.timestamp = result.opt_nativeTime || -1;
        Y8().bounds = viewport.bounds; // was: Y8().W = T.W
        const volume = result.opt_nativeVolume; // was: W
        if (volume !== undefined) viewport.volume = volume; // was: T.volume = W
      });
    }
  }

  getName() { return "nis"; }
}

/** @type {PB} Zero-rect constant for hidden native views [was: INm] */
const ZERO_RECT = new reportTelemetry(0, 0, 0, 0); // was: INm

/**
 * NIS measurement provider.
 * [was: ojO]
 */
export class NisMeasurementProvider extends ViewabilityManager { // was: ojO extends QW
  constructor() { super(new MeasurementClient(win, 2)); }

  getName() { return "nis"; }

  isAvailable() { // was: A()
    const env = Y8();
    rs();
    return env.isNativeBridge && false; // was: Q.O && !1
  }

  createObserver(element, config, context) { // was: j(Q, c, W)
    return new NisBridgeObserver(this.plugin, config, context);
  }
}

// =========================================================================
// MRAID Measurement Plugin   [was: EW, lines 60388-60442]
// =========================================================================

/**
 * MRAID (Mobile Rich-media Ad Interface Definitions) measurement plugin.
 * Integrates with the MRAID SDK for in-app viewability measurement.
 *
 * [was: EW]
 */
export class MraidMeasurementPlugin extends MeasurementClient { // was: EW extends pK
  constructor() {
    super(win, 2, "mraid");

    /** @type {number} MRAID version detected [was: this.Y0] */
    this.mraidVersion = 0; // was: this.Y0

    /** @type {boolean} Load complete [was: this.jG] */
    this.loadComplete = false; // was: this.jG

    /** @type {boolean} Snapshot taken [was: this.Ka] */
    this.snapshotTaken = false; // was: this.Ka

    /** @type {?string} Error code [was: this.L] */
    this.NetworkErrorCode = null; // was: this.L

    /** @type {*} MRAID bridge reference [was: this.O] */
    this.bridge = zd(this.rootDocument); // was: this.O = zd(this.A)

    this.viewport.bounds = new reportTelemetry(0, 0, 0, 0); // was: this.j.W = new PB(0,0,0,0)

    /** @type {boolean} Scale correction applied [was: this.Re] */
    this.scaleApplied = false; // was: this.Re
  }

  /**
   * Whether the MRAID bridge is available.
   * [was: T2]
   * @returns {boolean}
   */
  isBridgeAvailable() { // was: T2()
    return this.bridge.OBSERVATION_RECORD_FIELDS != null; // was: this.O.Cd != null
  }

  /**
   * Returns MRAID-specific diagnostic metadata.
   * [was: JJ]
   * @returns {Object}
   */
  getDiagnostics() { // was: JJ()
    const info = {}; // was: Q
    if (this.mraidVersion) info.mraid = this.mraidVersion;
    if (this.loadComplete) info.mlc = 1;
    info.mtop = this.bridge.Oj; // was: Q.mtop = this.O.Oj
    if (this.NetworkErrorCode) info.mse = this.NetworkErrorCode;
    if (this.scaleApplied) info.msc = 1;
    info.mcp = this.bridge.compatibility; // was: Q.mcp = this.O.compatibility
    return info;
  }

  /**
   * Initialise the MRAID measurement plugin.
   * [was: initialize]
   * @returns {boolean}
   */
  initialize() { // was: initialize()
    if (this.isInitialized) return !this.Ie();

    this.isInitialized = true;

    if (this.bridge.compatibility === 2) {
      this.NetworkErrorCode = "ng"; // was: this.L = "ng"
      this.fail("w");
      return false;
    }

    if (this.bridge.compatibility === 1) {
      this.NetworkErrorCode = "mm"; // was: this.L = "mm"
      this.fail("w");
      return false;
    }

    Y8().isMraid = true; // was: Y8().L = !0

    if (this.rootDocument.document.readyState === "complete") {
      gM(this);
    } else {
      wireEvent(this.rootDocument, "load", () => {
        bj().setTimeout(wrapForOW(292, () => gM(this)), 100);
      }, 292);
    }

    return true;
  }

  /**
   * Update viewport from MRAID getMaxSize.
   * [was: UH]
   */
  updateMaxSize() { // was: UH()
    const env = Y8(); // was: Q
    const maxSize = v5(this, "getMaxSize"); // was: c
    env.bounds = new reportTelemetry(0, maxSize.width, maxSize.height, 0); // was: Q.W = new PB(...)
  }

  /**
   * Update screen size from MRAID getScreenSize.
   * [was: XI]
   */
  updateScreenSize() { // was: XI()
    Y8().viewport = v5(this, "getScreenSize"); // was: Y8().j = v5(this, "getScreenSize")
  }

  /**
   * Dispose the MRAID bridge.
   * [was: dispose]
   */
  dispose() { // was: dispose()
    fX(this);
    super.dispose();
  }
}

// =========================================================================
// Feature flag   [was: FVd, lines 60444-60451]
// =========================================================================

/**
 * Boolean feature flag with experiment ID.
 * [was: FVd]
 * @type {{ key: string, defaultValue: boolean, valueType: string }}
 */
export const AUDIO_TRAFFIC_TYPE_FLAG = new (class { // was: FVd
  constructor(key, defaultValue = false) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.valueType = "boolean";
  }
})("45378663");

// =========================================================================
// AdLifecycleEventHandler   [was: ZS7, lines 60452-60620]
// =========================================================================

/**
 * Manages the dispatch of ad lifecycle events (start, quartiles, pause,
 * resume, skip, fullscreen, etc.) and wires them to the viewability
 * measurement system.
 *
 * [was: ZS7]
 */
export class AdLifecycleEventHandler { // was: ZS7
  constructor() {
    /** @type {boolean} Whether this handler has been initialised [was: this.isInitialized] */
    this.isInitialized = false;

    /** @type {?Object} Primary metric provider reference [was: this.O] */
    this.primaryProvider = null; // was: this.O

    /** @type {?Object} Cached metric provider [was: this.W] */
    this.cachedProvider = null; // was: this.W

    /**
     * Video event handler map.
     * [was: this.La]
     * @type {Object<string, Function>}
     */
    this.videoHandlers = { // was: this.La
      start: this.handleStart, // was: this.Sh
      firstquartile: this.handleFirstQuartile, // was: this.iX
      midpoint: this.handleMidpoint, // was: this.MQ
      thirdquartile: this.handleThirdQuartile, // was: this.d3
      complete: this.handleComplete, // was: this.EC
      error: this.handleError, // was: this.Fw
      pause: this.handlePause, // was: this.jG
      resume: this.handleResume, // was: this.Re
      skip: this.handleSkip, // was: this.Xw
      viewable_impression: this.handleGeneric, // was: this.A
      mute: this.handleMuteUnmute, // was: this.j
      unmute: this.handleMuteUnmute, // was: this.j
      fullscreen: this.handleFullscreen, // was: this.sC
      exitfullscreen: this.handleExitFullscreen, // was: this.WB
      fully_viewable_audible_half_duration_impression: this.handleGeneric,
      measurable_impression: this.handleGeneric,
      abandon: this.handlePause,
      engagedview: this.handleGeneric,
      impression: this.handleGeneric,
      creativeview: this.handleGeneric,
      progress: this.handleMuteUnmute,
      custom_metric_viewable: this.handleGeneric,
      bufferstart: this.handlePause,
      bufferfinish: this.handleResume,
      audio_measurable: this.handleGeneric,
      audio_audible: this.handleGeneric,
    };

    /**
     * Overlay event handler map.
     * [was: this.nO]
     * @type {Object<string, Function>}
     */
    this.overlayHandlers = { // was: this.nO
      overlay_resize: this.handleOverlayResize, // was: this.qQ
      abandon: this.handleAbandon, // was: this.MM
      close: this.handleAbandon,
      collapse: this.handleAbandon,
      overlay_unmeasurable_impression: (session) => W5(session, "overlay_unmeasurable_impression", WN()),
      overlay_viewable_immediate_impression: (session) => W5(session, "overlay_viewable_immediate_impression", WN()),
      overlay_unviewable_impression: (session) => W5(session, "overlay_unviewable_impression", WN()),
      overlay_viewable_end_of_session_impression: (session) => W5(session, "overlay_viewable_end_of_session_impression", WN()),
    };

    rs().O = 3;
    p07(this);

    /** @type {?PB} Pending bounding rect [was: this.K] */
    this.pendingRect = null; // was: this.K
  }

  /**
   * Finalize a session.
   * [was: L]
   */
  finalizeSession(session) { // was: L(Q)
    bn(session, false);
    jcy(session);
  }

  /** Hook for subclass override. [was: Y] */
  onSessionCreated() {} // was: Y() {}

  /**
   * Create a new viewability session.
   * [was: S]
   */
  createSession(config, startTime, isTimed, queryId) { // was: S(Q, c, W, m)
    const session = new AdViewabilitySession(
      config,
      isTimed ? startTime : -1,
      this.createFlagMapper(),
      this.getMetricBundle()
    ); // was: Q = new AO_(Q, W ? c : -1, this.T2(), this.HA())

    session.queryId = queryId; // was: Q.i9 = m
    N0m(session.yE);
    ef(session.yE, "queryid", session.queryId);
    session.lq("");

    x$3(session,
      (...args) => this.onPingEvent(...args),
      (...args) => QgX(this, ...args)
    ); // was: x$3(Q, (...K) => this.JJ(...K), ...)

    const pendingPlugin = gf(PluginSlotHolder).pluginInstance; // was: m = gf(t_).W
    if (pendingPlugin) jN(session, pendingPlugin);

    if (this.pendingRect) {
      session.forwardRect(this.pendingRect);
      this.pendingRect = null;
    }

    if (session.xc.updateAutoHideFlags) gf(MeasurementHook);

    return session;
  }

  /**
   * Handle measurement-provider changes.
   * [was: mF]
   */
  handleProviderChange(provider) { // was: mF(Q)
    switch (provider.oM()) {
      case 0: {
        const pluginHolder = gf(PluginSlotHolder).pluginInstance; // was: Q = gf(t_).W
        if (pluginHolder) {
          const mgr = pluginHolder.manager; // was: Q.W
          remove(mgr.plugins, this);
          if (mgr.hasPending && this.reportsViewability()) r9(mgr);
        }
        A3();
        break;
      }
      case 2:
        DL();
        break;
    }
  }

  /** Hook for subclass override. [was: D] */
  onDispose() {} // was: D() {}

  /** [was: Rw] */
  reportsViewability() { return false; }

  // ── Video event handlers ──

  handleStart(session) { // was: Sh(Q)
    let metadata = session.metadataFetcher(session); // was: c
    if (metadata) {
      const volume = metadata.volume; // was: c.volume
      session.wasAudibleAtStart = k8(volume) && volume > 0;
    }
    YE(session, 0);
    return W5(session, "start", WN());
  }

  handleMuteUnmute(session, _params, eventName) { // was: j(Q, c, W)
    xk(globalSamplingState, [session], !WN());
    return this.handleGeneric(session, _params, eventName);
  }

  handleGeneric(session, _params, eventName) { // was: A(Q, c, W)
    return W5(session, eventName, WN());
  }

  handleFirstQuartile(session) { // was: iX(Q)
    return Dx(session, "firstquartile", 1);
  }

  handleMidpoint(session) { // was: MQ(Q)
    session.midpointReached = true; // was: Q.JJ = !0
    return Dx(session, "midpoint", 2);
  }

  handleThirdQuartile(session) { // was: d3(Q)
    return Dx(session, "thirdquartile", 3);
  }

  handleComplete(session) { // was: EC(Q)
    const result = Dx(session, "complete", 4);
    C4(session);
    return result;
  }

  handleError(session) { // was: Fw(Q)
    session.playbackState = 3; // was: Q.uy = 3
    return W5(session, "error", WN());
  }

  handleResume(session, _params, eventName) { // was: Re(Q, c, W)
    const isMeasurable = WN(); // was: c
    if (session.isPaused() && !isMeasurable) {
      const tracker = session.getCurrentTracker(); // was: m
      const now = Date.now() - adTimingStart; // was: K
      tracker.lastTime = now; // was: m.L = K
    }
    xk(globalSamplingState, [session], !isMeasurable);
    if (session.isPaused()) session.playbackState = 1; // was: Q.uy = 1
    return W5(session, eventName, isMeasurable);
  }

  handleSkip(session, params) { // was: Xw(Q, c)
    const result = this.handleMuteUnmute(session, params || {}, "skip");
    C4(session);
    return result;
  }

  handleFullscreen(session, params) { // was: sC(Q, c)
    bn(session, true);
    return this.handleMuteUnmute(session, params || {}, "fullscreen");
  }

  handleExitFullscreen(session, params) { // was: WB(Q, c)
    bn(session, false);
    return this.handleMuteUnmute(session, params || {}, "exitfullscreen");
  }

  handlePause(session, _params, eventName) { // was: jG(Q, c, W)
    const tracker = session.getCurrentTracker(); // was: c
    const now = Date.now() - adTimingStart; // was: m
    tracker.pauseAccum = $E(tracker, now, session.playbackState !== 1); // was: c.PA = $E(c, m, Q.uy != 1)
    xk(globalSamplingState, [session], !WN());
    if (session.playbackState === 1) session.playbackState = 2; // was: Q.uy == 1 && (Q.uy = 2)
    return W5(session, eventName, WN());
  }

  handleOverlayResize(session) { // was: qQ(Q)
    xk(globalSamplingState, [session], !WN());
    return session.O();
  }

  handleAbandon(session) { // was: MM(Q)
    xk(globalSamplingState, [session], !WN());
    this.handleSessionEnd(session); // was: this.Y0(Q)
    C4(session);
    return session.O();
  }

  // ── Hooks for subclass override ──

  onPingEvent() {} // was: JJ() {}
  onPingComplete() {} // was: UH() {}
  handleSessionEnd() {} // was: Y0() {}
  onViewportUpdate() {} // was: XI() {}
  onMeasurementInit() {} // was: Ie() {}

  /**
   * Get or create the metric bundle (metric provider).
   * [was: HA]
   * @returns {MetricProviderBase}
   */
  getMetricBundle() { // was: HA()
    if (!this.cachedProvider) this.cachedProvider = this.onMeasurementInit();
    return this.cachedProvider == null ? new NoOpMetricProvider() : new StandardMetricBundle(this.cachedProvider);
  }

  /**
   * Create the flag mapper for pings.
   * [was: T2]
   * @returns {StandardFlagMapper}
   */
  createFlagMapper() { // was: T2()
    return new StandardFlagMapper(); // was: new nvx
  }
}

// =========================================================================
// Audio metric conditions   [was: EvW, s5d, dh3, lines 60622-60648]
// =========================================================================

/**
 * "Audio audible" condition -- satisfied when audio measurability reaches level 4.
 * [was: EvW]
 */
export class AudioAudibleCondition extends MetricCondition { // was: EvW extends X_
  constructor(thresholds) { // was: constructor(Q)
    super("audio_audible", thresholds);
  }

  check(session) { // was: W(Q)
    return session.getAudioMeasurability() === 4; // was: Q.qN() == 4
  }
}

/**
 * "Audio measurable" condition -- satisfied at audio measurability >= 3.
 * [was: s5d]
 */
export class AudioMeasurableCondition extends MetricConditionWithHistory { // was: s5d extends rOK
  constructor(thresholds) { // was: constructor(Q)
    super("audio_measurable", thresholds);
  }

  check(session) { // was: W(Q)
    const level = session.getAudioMeasurability(); // was: Q = Q.qN()
    return level === 3 || level === 4;
  }
}

/**
 * Audio-specific metric provider bundle.
 * [was: dh3]
 */
export class AudioMetricBundle extends MetricProviderBundle { // was: dh3 extends t9K
  getPrimary() { // was: O()
    return new AudioMeasurableCondition(this.thresholds);
  }

  getSecondary() { // was: A()
    return [new AudioAudibleCondition(this.thresholds)];
  }
}

// =========================================================================
// Audio-aware flag mapper   [was: LVK, lines 60650-60663]
// =========================================================================

/**
 * Flag mapper that adjusts for audio-only traffic.
 * Remaps certain viewability-state values when audio-specific conditions apply.
 *
 * [was: LVK]
 */
export class AudioFlagMapper extends ViewabilityFlagMapper { // was: LVK extends mhO
  /**
   * [was: W]
   * @param {Object} pingData [was: Q]
   * @returns {ViewabilityFlags}
   */
  mapFlags(pingData) { // was: W(Q)
    if (pingData) {
      if (pingData.e === 28) {
        pingData = Object.assign({}, pingData, { avas: 3 });
      }
      if (pingData.voidSink === 4 || pingData.voidSink === 5) {
        pingData = Object.assign({}, pingData, { voidSink: 3 });
      }
    }

    const flags = new ViewabilityFlags(); // was: c = new WV0()
    flags.primary = aw(pingData, AUDIO_VIDEO_METRIC_KEYS); // was: c.W = aw(Q, Q50)
    flags.secondary = aw(pingData, AUDIO_SUPPLEMENTARY_KEYS); // was: c.O = aw(Q, cOO)
    return flags;
  }
}

// =========================================================================
// ExternalFunctionProvider   [was: wyK, lines 60665-60672]
// =========================================================================

/**
 * Wraps a global function path for lazy retrieval.
 * [was: wyK]
 */
export class ExternalFunctionProvider { // was: wyK
  /**
   * @param {string} functionPath - Dot-delimited global path [was: Q]
   */
  constructor(functionPath) { // was: constructor(Q)
    /** @type {string} [was: this.W] */
    this.functionPath = functionPath; // was: this.W
  }

  /**
   * Resolve the function from the global scope.
   * [was: O]
   * @returns {?Function}
   */
  resolve() { // was: O()
    return getObjectByPath(this.functionPath); // was: g.DR(this.W)
  }
}

// =========================================================================
// YouTubeActiveViewManager   [was: y7, lines 60674-60796]
// =========================================================================

/**
 * YouTube-specific Active-View manager. Extends the base lifecycle event
 * handler with YouTube metadata resolution, traffic-type awareness
 * (audio vs. video), and integration with the YouTube ad SDK.
 *
 * [was: y7]
 */
export class YouTubeActiveViewManager extends AdLifecycleEventHandler { // was: y7 extends ZS7
  constructor() {
    super();

    /** @type {?Object} Plugin state association [was: this.PA] */
    this.pluginState = null; // was: this.PA

    /** @type {boolean} Whether cross-impression tracking is on [was: this.Ka] */
    this.crossImpressionEnabled = false; // was: this.Ka

    /** @type {string} Traffic type [was: this.b0] */
    this.trafficType = "ACTIVE_VIEW_TRAFFIC_TYPE_UNSPECIFIED"; // was: this.b0
  }

  /**
   * Create or look up a viewability session for the given ad.
   * [was: Y]
   */
  onSessionCreated(config, options) { // was: Y(Q, c)
    let session; // was: W
    const pluginHolder = gf(PluginSlotHolder); // was: m = gf(t_)

    if (pluginHolder.pluginInstance != null) {
      switch (pluginHolder.pluginInstance.getName()) {
        case "nis":
          session = xi_(this, config, options);
          break;
        case "gsv":
          session = getOrCreateTrackingEvent(this, config, options);
          break;
        case "exc":
          session = getOrCreateHeartbeatEvent(this, config);
          break;
      }
    }

    if (!session) {
      if (options.opt_overlayAdElement) {
        session = undefined;
      } else if (options.opt_adElement) {
        session = APx(this, config, options.opt_adElement, options.opt_osdId);
      }
    }

    if (session?.getUnitType() === 1) {
      if (session.metadataFetcher === g.vB) {
        session.metadataFetcher = (s) => this.onViewportUpdate(s);
      }
      registerConfigurableEvents(this, session, options);
    }

    return session;
  }

  /**
   * Resolve video metadata from the hosting SDK.
   * [was: XI]
   */
  onViewportUpdate(session) { // was: XI(Q)
    session.metadataError = 0;
    session.metadataErrorCode = 0;
    let metadata; // was: c

    if (session.slotType === "h" || session.slotType === "n") {
      rs();
      if (session.hostAdapter) {
        rs();
        xN(this) !== "h" && xN(this);
      }
      const getter = getObjectByPath("ima.common.getVideoMetadata"); // was: W
      if (typeof getter === "function") {
        try { metadata = getter(session.queryId); }
        catch (_e) { session.metadataError |= 4; }
      } else {
        session.metadataError |= 2;
      }
    } else if (session.slotType === "b") {
      const getter = getObjectByPath("ytads.bulleit.getVideoMetadata");
      if (typeof getter === "function") {
        try { metadata = getter(session.queryId); }
        catch (_e) { session.metadataError |= 4; }
      } else {
        session.metadataError |= 2;
      }
    } else if (session.slotType === "ml") {
      const getter = getObjectByPath("ima.common.getVideoMetadata");
      if (typeof getter === "function") {
        try { metadata = getter(session.queryId); }
        catch (_e) { session.metadataError |= 4; }
      } else {
        session.metadataError |= 2;
      }
    } else {
      session.metadataError |= 1;
    }

    if (!session.metadataError) {
      if (metadata === undefined) session.metadataError |= 8;
      else if (metadata === null) session.metadataError |= 16;
      else if (isEmptyObject(metadata)) session.metadataError |= 32;
      else if (metadata.NetworkErrorCode != null) {
        session.metadataErrorCode = metadata.NetworkErrorCode;
        session.metadataError |= 64;
      }
    }

    if (metadata == null) metadata = {};

    // Track missing fields
    session.fieldMissingMask = 0;
    for (const field in fBd) {
      if (metadata[field] == null) session.fieldMissingMask |= fBd[field];
    }

    $k(metadata, "currentTime");
    $k(metadata, "duration");

    if (k8(metadata.volume) && k8()) {
      metadata.volume *= NaN; // Intentional -- sanitises invalid volume
    }

    return metadata;
  }

  /**
   * Resolve the external metrics function reference.
   * [was: Ie]
   */
  onMeasurementInit() { // was: Ie()
    rs();
    xN(this) !== "h" && xN(this);
    const path = getExternalActivityBridge(this); // was: Q
    return path != null ? new ExternalFunctionProvider(path) : null;
  }

  /**
   * Handle overlay unmeasurable state.
   * [was: UH]
   */
  onPingComplete(session) { // was: UH(Q)
    if (!session.conditions && session.wrapWithReporter) {
      if (nd(this, session, "overlay_unmeasurable_impression")) {
        session.conditions = true; // was: Q.W = !0
      }
    }
  }

  /**
   * Handle session end for overlays.
   * [was: Y0]
   */
  handleSessionEnd(session) { // was: Y0(Q)
    if (session.Sx) {
      if (session.wN()) {
        nd(this, session, "overlay_viewable_end_of_session_impression");
      } else {
        nd(this, session, "overlay_unviewable_impression");
      }
      session.Sx = false;
    }
  }

  /** [was: JJ] */
  onPingEvent() {}

  /**
   * Create a session with traffic-type awareness.
   * [was: S]
   */
  createSession(config, startTime, isTimed, queryId) { // was: S(Q, c, W, m)
    if (rs().flags.BA(AUDIO_TRAFFIC_TYPE_FLAG)) {
      const mmParam = VA(rs().yE, "mm"); // was: K
      const trafficType = {
        [FA.isValidBox]: "ACTIVE_VIEW_TRAFFIC_TYPE_AUDIO",
        [FA.VIDEO]: "ACTIVE_VIEW_TRAFFIC_TYPE_VIDEO",
      }[mmParam];
      if (trafficType) setClickTrackingTarget(this, trafficType);

      if (this.trafficType === "ACTIVE_VIEW_TRAFFIC_TYPE_UNSPECIFIED") {
        ak.Iy(1044, Error(), undefined, undefined);
      }
    }

    const session = super.createSession(config, startTime, isTimed, queryId);

    if (this.crossImpressionEnabled) {
      const state = this.pluginState; // was: c
      if (session.cachedRect == null) session.cachedRect = new JU_();
      state.registry[session.queryId] = session.cachedRect;
      session.cachedRect.key = timestampBaseline; // was: Q.K.K = eN7
    }

    return session;
  }

  /**
   * Finalize and clean up a session.
   * [was: L]
   */
  finalizeSession(session) { // was: L(Q)
    if (session?.getUnitType() === 1 && this.crossImpressionEnabled) {
      delete this.pluginState.registry[session.queryId];
    }
    return super.finalizeSession(session);
  }

  /** @override [was: HA] */
  getMetricBundle() { // was: HA()
    if (!this.cachedProvider) this.cachedProvider = this.onMeasurementInit();
    return this.cachedProvider == null
      ? new NoOpMetricProvider()
      : this.trafficType === "ACTIVE_VIEW_TRAFFIC_TYPE_AUDIO"
        ? new AudioMetricBundle(this.cachedProvider)
        : new StandardMetricBundle(this.cachedProvider);
  }

  /** @override [was: T2] */
  createFlagMapper() { // was: T2()
    return this.trafficType === "ACTIVE_VIEW_TRAFFIC_TYPE_AUDIO"
      ? new AudioFlagMapper()
      : new StandardFlagMapper();
  }

  /**
   * Forward a bounding rectangle to the active session.
   * [was: J]
   */
  forwardBoundingRect(queryId, left, top, width, height) { // was: J(Q, c, W, m, K)
    const rect = new reportTelemetry(top, left + width, top + height, left); // was: c = new PB(W, c + m, W + K, c)
    const session = T9(globalEventBuffer, queryId); // was: Q = T9(rM, Q)
    if (session) {
      session.forwardRect(rect); // was: Q.J(c)
    } else {
      this.pendingRect = rect; // was: this.K = c
    }
  }
}

// =========================================================================
// Global API exposure   [was: lines 60797-60813]
// =========================================================================

/** @type {Function} VAST event sender [was: bSm] */
export const vastEventSender = Gd(193, Sv, undefined, G9); // was: bSm
setGlobal("Goog_AdSense_Lidar_sendVastEvent", vastEventSender);

/** @type {Function} Viewability query [was: j5X] */
export const viewabilityQuery = Gd(194, function(queryId, options = {}) {
  const session = iQ(gf(YouTubeActiveViewManager), queryId, options);
  return Nj(session);
});
setGlobal("Goog_AdSense_Lidar_getViewability", viewabilityQuery);

/** @type {Function} URL signals (array form) [was: gvO] */
export const urlSignalsArray = Gd(195, function() {
  return je();
});
setGlobal("Goog_AdSense_Lidar_getUrlSignalsArray", urlSignalsArray);

/** @type {Function} URL signals (JSON form) [was: OSO] */
export const urlSignalsJson = Gd(196, function() {
  return JSON.stringify(je());
});
setGlobal("Goog_AdSense_Lidar_getUrlSignalsList", urlSignalsJson);

// =========================================================================
// PingUrl   [was: BG_, lines 60814-60824]
// =========================================================================

/**
 * Wraps a tracking/ping URL, parsing its query parameters and
 * recording the wall-clock offset at construction time.
 *
 * [was: BG_]
 */
export class PingUrl { // was: BG_
  /**
   * @param {{ url: string, GmC: * }} options [was: { url: Q, GmC: c }]
   */
  constructor({ url, GmC: gmcPayload }) { // was: constructor({url: Q, GmC: c})
    /** @type {string} Raw URL [was: this.O] */
    this.url = url; // was: this.O = Q

    /** @type {*} GMC payload [was: this.j] */
    this.gmcPayload = gmcPayload; // was: this.j = c

    /** @type {number} Wall-clock offset in ms since ~2024-01-01 [was: this.A] */
    this.wallClockOffset = new Date().getTime() - 1704067200000; // was: this.A

    /** @type {Object<string, string>} Parsed query params [was: this.W] */
    this.params = {}; // was: this.W

    const paramRegex = /[?&]([^&=]+)=([^&]*)/g; // was: W
    let match;
    while ((match = paramRegex.exec(url)) !== null) {
      this.params[match[1]] = match[2];
    }
  }
}

// =========================================================================
// ModuleError   [was: g5, lines 60826-60836]
// =========================================================================

/**
 * Error class for module-level failures with a numeric error code.
 *
 * [was: g5]
 */
export class ModuleError extends Error { // was: g5 extends Error
  /**
   * @param {number} code - Numeric error code [was: Q]
   * @param {string} prefix - Error message prefix [was: c]
   * @param {Error} [cause=Error()] - Underlying cause [was: W]
   */
  constructor(code, prefix, cause = Error()) { // was: constructor(Q, c, W=Error())
    super();

    /** @type {number} */
    this.code = code; // was: this.code = Q

    const sep = prefix + ":"; // was: c += ":"
    if (cause instanceof Error) {
      this.message = sep + cause.message;
      this.stack = cause.stack || "";
    } else {
      this.message = sep + String(cause);
      this.stack = "";
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =========================================================================
// WebPlayerContainer bindings   [was: yPn, w5, lines 60838-60885]
// =========================================================================

/**
 * Wraps the native Web Player Container (wpc) API for integrity token
 * acquisition, challenge response, and message signing.
 *
 * [was: yPn]
 */
export class WpcIntegrityAdapter extends Disposable { // was: yPn extends g.qK
  /**
   * @param {Object} wpc - Native Web Player Container handle [was: Q]
   */
  constructor(wpc) { // was: constructor(Q)
    super();
    /** @type {Object} [was: this.wpc] */
    this.wpc = wpc;
  }

  /**
   * Acquire an integrity token.
   * [was: AC]
   * @returns {Promise}
   */
  acquireToken() { // was: AC()
    return this.wpc.f();
  }

  /**
   * Complete a challenge.
   * [was: NW]
   * @param {*} challenge [was: Q]
   */
  completeChallenge(challenge) { // was: NW(Q)
    this.wpc.c(challenge);
  }

  /**
   * Sign a message.
   * [was: A]
   * @param {*} message [was: Q]
   * @returns {*}
   */
  signMessage(message) { // was: A(Q)
    return this.wpc.m(jv(message));
  }

  /**
   * Sign a message (streaming variant).
   * [was: Ol]
   * @param {*} message [was: Q]
   * @returns {*}
   */
  signMessageStreaming(message) { // was: Ol(Q)
    return this.wpc.mws(jv(message));
  }
}

/**
 * DOM event interceptor for the Web Player Container.
 * Captures a configurable set of DOM events and forwards them to the
 * wpc for bot-detection / interaction logging.
 *
 * [was: w5]
 */
export class WpcEventInterceptor extends Disposable { // was: w5 extends g.qK
  /**
   * @param {Object} wpc - Native Web Player Container handle [was: Q]
   */
  constructor(wpc) { // was: constructor(Q)
    super();

    /** @type {Object} wpc handle [was: this.OG] */
    this.wpcHandle = wpc; // was: this.OG = Q

    /**
     * DOM event types to intercept.
     * [was: this.A]
     * @type {string[]}
     */
    this.interceptedEvents = "keydown keypress keyup input focusin focusout select copy cut paste change click dblclick auxclick pointerover pointerdown pointerup pointermove pointerout dragenter dragleave drag dragend mouseover mousedown mouseup mousemove mouseout touchstart touchend touchmove wheel".split(" ");

    /** @type {undefined|*} Internal state [was: this.O] */
    this.internalState = undefined; // was: this.O = void 0

    /** @type {*} Plugin reference [was: this.XQ] */
    this.pluginRef = this.wpcHandle.p; // was: this.XQ = this.OG.p

    /** @type {Function} Bound event handler [was: this.j] */
    this.boundHandler = this.handleDomEvent.bind(this); // was: this.j = this.J5.bind(this)

    this.addOnDisposeCallback(() => void iR3(this));
  }

  /**
   * Take a snapshot of the current interaction state.
   * [was: snapshot]
   * @param {Object} options [was: Q]
   * @returns {*}
   */
  snapshot(options) { // was: snapshot(Q)
    return this.wpcHandle.s({
      ...(options.createFadeTransition && { c: options.createFadeTransition }),
      ...(options.gf && { s: options.gf }),
      ...(options.getActiveLayout !== undefined && { p: options.getActiveLayout }),
    });
  }

  /**
   * Forward a DOM event to the wpc.
   * [was: J5]
   * @param {Event} event [was: Q]
   */
  handleDomEvent(event) { // was: J5(Q)
    this.wpcHandle.e(event);
  }

  /**
   * Get the logger instance from the wpc.
   * [was: Bt]
   * @returns {*}
   */
  getLogger() { // was: Bt()
    return this.wpcHandle.l();
  }
}

// =========================================================================
// SharedDisposable   [was: fNx, lines 60887-60901]
// =========================================================================

/**
 * Reference-counted disposable. Calling `.share()` increments the
 * reference count; each `.dispose()` decrements it.  The underlying
 * disposal only runs when the count reaches zero.
 *
 * [was: fNx]
 */
export class SharedDisposable extends Disposable { // was: fNx extends g.qK
  constructor(...args) {
    super(...args);

    /** @type {number} Reference count [was: this.b0] */
    this.refCount = 1; // was: this.b0 = 1
  }

  /**
   * Increment the reference count and return `this`.
   * Throws if already fully disposed.
   * [was: share]
   * @returns {this}
   */
  share() { // was: share()
    if (this.u0()) throw Error("E:AD");
    this.refCount++;
    return this;
  }

  /**
   * Decrement the reference count; only disposes when it reaches 0.
   * [was: dispose]
   */
  dispose() { // was: dispose()
    if (--this.refCount === 0) super.dispose(); // was: --this.b0 || super.dispose()
  }
}

// =========================================================================
// Client Streamz reporters   [was: vvy .. ClR, lines 60903-60993]
// =========================================================================

/**
 * Streamz counter reporter for `/client_streamz/bg/frs`.
 * [was: vvy]
 */
export class FrsStreamzReporter { // was: vvy
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.W = Q
    registerHistogram(streamzClient, "/client_streamz/bg/frs", stringFieldDescriptor("mk"));
  }

  report(count, metricKey) { // was: Y3(Q, c)
    this.client.getExperimentNumber("/client_streamz/bg/frs", count, metricKey);
  }
}

/**
 * Streamz counter reporter for `/client_streamz/bg/wrl`.
 * [was: aN3]
 */
export class WrlStreamzReporter { // was: aN3
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.W = Q
    registerHistogram(streamzClient, "/client_streamz/bg/wrl", stringFieldDescriptor("mn"), int64FieldDescriptor("ac"), int64FieldDescriptor("sc"), stringFieldDescriptor("rk"), stringFieldDescriptor("mk"));
  }

  report(count, mn, ac, sc, rk, mk) { // was: Y3(Q, c, W, m, K, T)
    this.client.getExperimentNumber("/client_streamz/bg/wrl", count, mn, ac, sc, rk, mk);
  }
}

/**
 * Streamz event counter for `/client_streamz/bg/ec`.
 * [was: Go_]
 */
export class EcStreamzReporter { // was: Go_
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.O = Q
    registerCounter(streamzClient, "/client_streamz/bg/ec", stringFieldDescriptor("en"), stringFieldDescriptor("mk"));
  }

  increment(eventName, metricKey) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/bg/ec", eventName, metricKey);
  }
}

/**
 * Streamz event latency reporter for `/client_streamz/bg/el`.
 * [was: $hK]
 */
export class ElStreamzReporter { // was: $hK
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.W = Q
    registerHistogram(streamzClient, "/client_streamz/bg/el", stringFieldDescriptor("en"), stringFieldDescriptor("mk"));
  }

  report(count, eventName, metricKey) { // was: Y3(Q, c, W)
    this.client.getExperimentNumber("/client_streamz/bg/el", count, eventName, metricKey);
  }
}

/**
 * Streamz cumulative error counter for `/client_streamz/bg/cec`.
 * [was: Pl7]
 */
export class CecStreamzReporter { // was: Pl7
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.O = Q
    registerCounter(streamzClient, "/client_streamz/bg/cec", int64FieldDescriptor("ec"), stringFieldDescriptor("mk"));
  }

  increment(NetworkErrorCode, metricKey) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/bg/cec", NetworkErrorCode, metricKey);
  }
}

/**
 * Streamz counter for `/client_streamz/bg/po/csc`.
 * [was: lNw]
 */
export class CscStreamzReporter { // was: lNw
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.O = Q
    registerCounter(streamzClient, "/client_streamz/bg/po/csc", int64FieldDescriptor("cs"), stringFieldDescriptor("mk"));
  }

  increment(clientState, metricKey) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/bg/po/csc", clientState, metricKey);
  }
}

/**
 * Streamz counter for `/client_streamz/bg/po/ctav`.
 * [was: uzw]
 */
export class CtavStreamzReporter { // was: uzw
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.O = Q
    registerCounter(streamzClient, "/client_streamz/bg/po/ctav", stringFieldDescriptor("av"), stringFieldDescriptor("mk"));
  }

  increment(attestationVersion, metricKey) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/bg/po/ctav", attestationVersion, metricKey);
  }
}

/**
 * Streamz counter for `/client_streamz/bg/po/cwsc`.
 * [was: hN7]
 */
export class CwscStreamzReporter { // was: hN7
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.O = Q
    registerCounter(streamzClient, "/client_streamz/bg/po/cwsc", stringFieldDescriptor("su"), stringFieldDescriptor("mk"));
  }

  increment(statusUpdate, metricKey) { // was: W(Q, c)
    incrementCounter(this.client, "/client_streamz/bg/po/cwsc", statusUpdate, metricKey);
  }
}

/**
 * Streamz counter for `/client_streamz/bg/od/p`.
 * [was: zN7]
 */
export class OdPStreamzReporter { // was: zN7
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.W = Q
    registerHistogram(streamzClient, "/client_streamz/bg/od/p", stringFieldDescriptor("mk"));
  }

  report(count, metricKey) { // was: Y3(Q, c)
    this.client.getExperimentNumber("/client_streamz/bg/od/p", count, metricKey);
  }
}

/**
 * Streamz counter for `/client_streamz/bg/od/n`.
 * [was: ClR]
 */
export class OdNStreamzReporter { // was: ClR
  constructor(streamzClient) { // was: constructor(Q)
    this.client = streamzClient; // was: this.W = Q
    registerHistogram(streamzClient, "/client_streamz/bg/od/n", stringFieldDescriptor("et"), stringFieldDescriptor("mk"));
  }

  report(count, eventType, metricKey) { // was: Y3(Q, c, W)
    this.client.getExperimentNumber("/client_streamz/bg/od/n", count, eventType, metricKey);
  }
}
