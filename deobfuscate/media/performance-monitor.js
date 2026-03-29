/**
 * Performance monitoring — CPU profiling, self-profiling, format/CPN tracking,
 * and QoE state management.
 *
 * Extracted from base.js lines ~94209–94500.
 *
 * Contains:
 * - `MediaTimeTracker`  [was: Wav]  — current-time tracker with delay support
 * - `CpnFormatTracker`  [was: m9D]  — CPN / format switching tracker with
 *   map-based caching of active CPN per segment index
 * - `LiveEdgeEstimator` [was: Xdx]  — live-edge estimation via segment timing
 * - `CpuProfiler`       [was: KaW]  — CPU / hardware metrics via PerformanceObserver
 * - `SelfProfileLogger`  [was: TZ1]  — JS Self-Profiling API integration
 * - `QoeStateTracker`   [was: g.ji] — master QoE state machine (partial)
 *
 * @module performance-monitor
 */

import { Disposable } from '../core/disposable.js'; // was: g.qK
import { EventTarget } from '../core/events.js';     // was: g.W1
import { Timer } from '../core/timer.js';             // was: g.Uc
import { now } from '../core/timing.js';              // was: g.h
import { serializeMessage } from '../proto/varint-decoder.js'; // was: g.yu
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { isActivelyPlaying } from './source-buffer.js'; // was: Uj
import { getExperimentsToken } from '../data/idb-transactions.js'; // was: pe
import { getCurrentTime } from '../player/time-tracking.js';
import { onSeekComplete } from '../player/context-updates.js';
import { clear } from '../core/array-utils.js';
import { dispose } from '../ads/dai-cue-range.js';
import { forEach } from '../core/event-registration.js';
import { createElement } from '../core/dom-utils.js';
import { createLogger } from '../data/logger-init.js'; // was: g.JY
// TODO: resolve g.lj

// ============================================================================
// MediaTimeTracker  [was: Wav]
// ============================================================================

/**
 * Thin wrapper around the player interface that provides a delay-adjusted
 * "current time" for scheduling purposes.
 *
 * [was: Wav]
 */
export class MediaTimeTracker { // was: Wav
  /**
   * @param {object} playerInterface [was: Q] — player bridge (EH)
   */
  constructor(playerInterface) {
    /** @type {object} Player bridge. [was: EH] */
    this.playerInterface = playerInterface; // was: this.EH = Q

    /** @type {Map} Pending scheduled callbacks. [was: W] */
    this.scheduledCallbacks = new Map(); // was: this.W = new Map

    /** @type {?Timer} Active delay timer. [was: delay] */
    this.delay = null; // was: this.delay = null
  }

  /**
   * Return the current media time minus the live-edge offset.
   * [was: getCurrentTime]
   *
   * @returns {number} Adjusted current time in seconds
   */
  getCurrentTime() { // was: getCurrentTime()
    return this.playerInterface.getCurrentTime() - this.playerInterface.getStreamTimeOffsetNQ;
  }
}


// ============================================================================
// CpnFormatTracker  [was: m9D]
// ============================================================================

/**
 * Tracks CPN (Client Playback Nonce) transitions across segment boundaries,
 * enabling format/codec change detection for QoE reporting.
 *
 * Maintains two maps:
 *   - `segmentCpnMap` (W) — segment index → CPN/format info
 *   - `formatCacheMap` (A) — format key → cached descriptor
 *
 * Listens to player state-change, seek, and seek-complete events to
 * reset / re-derive CPN state.
 *
 * [was: m9D]
 */
export class CpnFormatTracker { // was: m9D
  /**
   * @param {object} schedule        [was: Q] — segment schedule (j)
   * @param {string} cpn             [was: c] — initial client playback nonce
   * @param {object} playerInterface [was: W] — player bridge (EH)
   */
  constructor(schedule, cpn, playerInterface) {
    /** @type {object} Segment schedule. [was: j] */
    this.schedule = schedule; // was: this.j = Q

    /** @type {string} Initial CPN. [was: cpn] */
    this.cpn = cpn; // was: this.cpn = c

    /** @type {object} Player bridge. [was: EH] */
    this.playerInterface = playerInterface; // was: this.EH = W

    /** @type {Map<number, object>} Segment index → CPN/format descriptor. [was: W] */
    this.segmentCpnMap = new Map(); // was: this.W = new Map

    /** @type {Map<string, object>} Format key → cached descriptor. [was: A] */
    this.formatCacheMap = new Map(); // was: this.A = new Map

    /** @type {number} Last processed segment index. [was: D] */
    this.lastSegmentIndex = NaN; // was: this.D = NaN

    /** @type {string} Previous CPN (for rollback on seek). [was: vG] */
    this.previousCpn = ''; // was: this.vG = ""

    /** @type {string} Current active CPN. [was: O] */
    this.activeCpn = ''; // was: this.O = ""

    /** @type {boolean} Whether a seek is in progress. [was: isSeeking] */
    this.isSeeking = false; // was: this.isSeeking = !1

    /** @private Media time tracker. [was: K] */
    this.timeTracker = new MediaTimeTracker(playerInterface); // was: this.K = new Wav(W)

    /** @type {object} Aggregate helper. [was: ag] */
    this.aggregate = playerInterface.ag; // was: this.ag = W.ag

    // Subscribe to player events
    this.playerInterface.subscribe('statechange', this.onStateChange, this);
    this.playerInterface.subscribe('SEEK_TO', () => { this.onSeekStart(); });
    this.playerInterface.subscribe('SEEK_COMPLETE', () => { onSeekComplete(this); }); // was: oVx(this)

    // Initialise CPN state
    this.previousCpn = this.cpn;   // was: this.vG = this.cpn
    this.activeCpn = this.cpn;     // was: this.O = this.cpn
  }

  /**
   * Handle a player state-change event.
   * Resets the time tracker when playback is interrupted.
   * [was: L]
   */
  onStateChange(stateEvent) { // was: L(Q)
    if (isActivelyPlaying(stateEvent.state)) lP(this.timeTracker); // was: Uj(Q.state) && lP(this.K)
  }

  /**
   * Clear all cached state (segment maps, format cache, last index).
   * [was: clear]
   */
  clear() { // was: clear()
    const tracker = this.timeTracker; // was: Q = this.K
    tracker.delay?.dispose();
    tracker.scheduledCallbacks.clear();
    this.formatCacheMap.clear();
    this.segmentCpnMap.clear();
    this.lastSegmentIndex = NaN;
  }

  /**
   * Process a segment-index update: record the CPN for the given index and
   * schedule delayed CPN-switch notifications.
   * [was: J]
   *
   * @param {number} segmentIndex [was: Q]
   * @param {?object} cpnInfo     [was: c] — CPN descriptor (null = revert to default)
   * @param {number} [offsetMs=0] [was: W] — time offset within the segment (ms)
   */
  processSegmentUpdate(segmentIndex, cpnInfo, offsetMs = 0) { // was: J(Q, c, W=0)
    if (segmentIndex === this.lastSegmentIndex &&
        this.segmentCpnMap.get(segmentIndex)?.A === cpnInfo?.A) {
      return;
    }

    if (cpnInfo) {
      this.segmentCpnMap.set(segmentIndex, cpnInfo);
    } else {
      this.segmentCpnMap.delete(segmentIndex);
    }

    if (this.isSeeking) return;

    const startTime = this.schedule.getStartTime(segmentIndex); // was: m
    this.lastSegmentIndex = segmentIndex;
    clearPendingNotifications(this, segmentIndex); // was: UMO(this, Q)

    if (cpnInfo) {
      let time = startTime; // was: K
      cpnInfo.W.forEach((newCpn, idx) => { // was: T, r
        if (time >= startTime + offsetMs) {
          if (newCpn !== this.activeCpn) {
            scheduleCpnSwitch(this, segmentIndex, newCpn,
              newCpn !== this.cpn ? time - cpnInfo.j[idx] : time);
            // was: IPx(this, Q, T, T !== this.cpn ? K - c.j[r] : K)
          }
        }
        time += cpnInfo.O[idx];
      });
    } else if (this.activeCpn !== this.cpn) {
      scheduleCpnSwitch(this, segmentIndex, this.cpn, startTime + offsetMs);
      // was: IPx(this, Q, this.cpn, m + W)
    }
  }

  /**
   * Called when a seek begins — freeze CPN state and clear pending notifications.
   * [was: uY]
   */
  onSeekStart() { // was: uY()
    this.isSeeking = true;
    const tracker = this.timeTracker; // was: Q = this.K
    tracker.delay?.dispose();
    tracker.scheduledCallbacks.clear();
    this.lastSegmentIndex = NaN;
    this.activeCpn = this.previousCpn; // was: this.O = this.vG
  }
}


// ============================================================================
// LiveEdgeEstimator  [was: Xdx]
// ============================================================================

/**
 * Estimates the live edge from segment timing for adaptive live streams.
 *
 * [was: Xdx]
 */
export class LiveEdgeEstimator { // was: Xdx
  /**
   * @param {object} loader   [was: Q] — segment loader
   * @param {object} policy   [was: c] — playback policy
   * @param {object} schedule [was: W] — segment schedule
   * @param {object} logFn    [was: m] — QoE logger (JY)
   * @param {object} seekMgr  [was: K] — seek manager (Y)
   */
  constructor(loader, policy, schedule, logFn, seekMgr) {
    /** @type {object} Segment loader. [was: loader] */
    this.loader = loader;
    /** @type {object} Playback policy. [was: policy] */
    this.policy = policy;
    /** @type {object} Segment schedule. [was: schedule] */
    this.schedule = schedule;
    /** @type {object} QoE logger. [was: JY] */
    this.logFn = logFn;
    /** @type {object} Seek manager. [was: Y] */
    this.seekMgr = seekMgr;

    /** @type {number} Last computed edge value. [was: mF] */
    this.lastEdge = NaN;
    /** @type {?object} Active request reference. [was: j] */
    this.activeRequest = null;
    /** @type {?object} Request metadata. [was: J] */
    this.requestMeta = null;
    /** @type {?object} Segment info. [was: O] */
    this.segmentInfo = null;
    /** @type {number} Start time (seconds, wall-clock). [was: startTimeSecs] */
    this.startTimeSecs = NaN;
    /** @type {number} Current estimate offset. [was: D] */
    this.estimateOffset = NaN;
    /** @type {number} Segment start-time in the schedule. [was: K] */
    this.scheduleStartTime = NaN;
    /** @type {number} Computed delta (seconds). [was: W] */
    this.delta = NaN;
    /** @type {boolean} Whether the estimate has converged. [was: A] */
    this.hasConverged = false;
    /** @type {number} Running accumulator. [was: L] */
    this.accumulator = NaN;
  }

  /**
   * Feed a new segment into the estimator and return the updated edge value.
   * [was: JF]
   *
   * @param {object} segmentQueue [was: Q]
   * @param {number} elapsed      [was: c] — elapsed time (ms)
   * @returns {number} Updated live-edge estimate, or NaN
   */
  update(segmentQueue, elapsed) { // was: JF(Q, c)
    if (this.activeRequest) {
      return xMd(this, elapsed); // was: xMd(this, c)
    }

    const head = Hp(segmentQueue); // was: c = Hp(Q)
    if (!head) return NaN;

    const meta = head.W; // was: W
    if (meta?.j && meta?.W) {
      const firstPending = segmentQueue.O.length ? segmentQueue.O[0] : null; // was: Q
      if (firstPending && firstPending.state >= 2 && !firstPending.CB() &&
          firstPending.info.Og === 0) {
        this.activeRequest = firstPending;      // was: this.j = Q
        this.requestMeta = meta;                // was: this.J = W
        this.segmentInfo = head.info;           // was: this.O = c.info
        this.startTimeSecs = Date.now() / 1000; // was: this.startTimeSecs
        this.estimateOffset = this.startTimeSecs; // was: this.D
        this.scheduleStartTime = this.segmentInfo.startTime; // was: this.K
      }
    }

    return NaN;
  }

  /**
   * Reset the estimator to its initial state.
   * [was: clear]
   */
  clear() { // was: clear()
    this.segmentInfo = this.requestMeta = this.activeRequest = null;
    this.delta = this.scheduleStartTime = this.estimateOffset = this.startTimeSecs = NaN;
    this.hasConverged = false;
  }
}


// ============================================================================
// CpuProfiler  [was: KaW]
// ============================================================================

/**
 * Collects CPU and hardware metrics using the (experimental)
 * `PerformanceObserver("cpu")` API and exposes them for QoE reporting.
 *
 * Reported fields:
 *   - `hwConcurrency` — `navigator.hardwareConcurrency`
 *   - `cpt` — latest CPU profile entry timestamp
 *   - `cps` — latest CPU profile entry state
 *   - `cpe` — error message if the observer failed (DOMException)
 *   - `cb2s` / `cb5s` / `cb30s` — Cobalt `cVal` CPU usage (2 s / 5 s / 30 s)
 *
 * [was: KaW]
 *
 * @extends Disposable
 */
export class CpuProfiler extends Disposable { // was: KaW
  constructor() {
    super();

    /** @private {?DOMException} Observer initialisation error. [was: W] */
    this.initError = undefined;

    /** @private {?object} Latest CPU profile entry. [was: O] */
    this.latestEntry = undefined;

    try {
      /**
       * @private PerformanceObserver instance.
       * [was: A]
       */
      this.observer = nV0((entries) => { // was: nV0(Q => { this.O = Q.at(-1) })
        this.latestEntry = entries.at(-1);
      });

      /**
       * @private Observe promise (resolved once observation starts).
       * [was: K]
       */
      this.observePromise = this.observer?.observe('cpu', {
        sampleInterval: 2000, // 2 s
      }).catch((err) => {
        if (err instanceof DOMException) this.initError = err;
      });
    } catch (err) {
      if (err instanceof DOMException) this.initError = err;
    }
  }

  /**
   * Collect current CPU / hardware metrics into a plain object.
   * [was: j]
   *
   * @returns {object} Metrics bag with `hwConcurrency`, `cpt`, `cps`, etc.
   */
  collectMetrics() { // was: j()
    const metrics = {};
    const cobalt = window.h5vcc; // was: c = window.h5vcc

    metrics.hwConcurrency = navigator.hardwareConcurrency;

    if (this.initError) {
      metrics.cpe = this.initError.message; // was: Q.cpe = this.W.message
    }
    if (this.latestEntry) {
      metrics.cpt = this.latestEntry.time;  // was: Q.cpt = this.O.time
      metrics.cps = this.latestEntry.state; // was: Q.cps = this.O.state
    }

    // Cobalt (h5vcc) CPU metrics — used on smart-TV / STB platforms.
    if (cobalt?.cVal) {
      metrics.cb2s = cobalt.cVal.getValue('CPU.Total.Usage.IntervalSeconds.2');
      metrics.cb5s = cobalt.cVal.getValue('CPU.Total.Usage.IntervalSeconds.5');
      metrics.cb30s = cobalt.cVal.getValue('CPU.Total.Usage.IntervalSeconds.30');
    }

    return metrics;
  }

  /** @override Tear down the observer. [was: WA] */
  dispose() { // was: WA()
    DM0(this); // was: DM0(this) — disconnect / cleanup observer
    super.dispose();
  }
}


// ============================================================================
// SelfProfileLogger  [was: TZ1]
// ============================================================================

/**
 * CPN-filtering regex — matches URLs that already carry a `cpn=` parameter.
 * [was: tw_]
 */
const CPN_URL_REGEX = /[?&]cpn=/; // was: tw_

/**
 * Wraps the JS Self-Profiling API (`Profiler`) to capture CPU traces during
 * playback and serialise them for QoE upload.
 *
 * [was: TZ1]
 *
 * @extends Disposable
 */
export class SelfProfileLogger extends Disposable { // was: TZ1
  constructor() {
    super();

    /** @type {number} Sample interval (ms). [was: sampleInterval] */
    this.sampleInterval = 100;

    /** @type {number} Maximum serialised buffer size (entries). [was: maxBufferSize] */
    this.maxBufferSize = 100;

    /** @private Serialisation codec. [was: K] */
    this.codec = ik3; // was: this.K = ik3

    /** @type {string[]} Serialised trace chunks. [was: W] */
    this.traceChunks = []; // was: this.W = []

    /** @type {number} Accumulated byte size. [was: A] */
    this.accumulatedSize = 0; // was: this.A = 0

    SI3(this); // was: SI3(this) — initialise the profiler instance (this.j)
  }

  /**
   * Flush collected trace data into a plain object for QoE upload.
   * [was: flush]
   *
   * @returns {{ pe?: string, pt?: string }} Flushed data
   */
  flush() { // was: flush()
    const result = {};
    if (this.profileError) result.getExperimentsToken = this.profileError; // was: this.O
    if (this.traceChunks.length > 0) {
      result.pt = this.traceChunks.join('.');
    }
    this.traceChunks = [];
    return result;
  }

  /**
   * Stop the profiler and log the final trace.
   * [was: stop]
   */
  async stop() { // was: async stop()
    try {
      const trace = await this.profiler?.stop(); // was: this.j?.stop()
      if (trace) this.logTrace(trace);
    } catch (err) {
      this.profileError = yYR(err.message); // was: this.O = yYR(Q.message)
    }
  }

  /**
   * Parse a raw `ProfilerTrace` and serialise it into a compact format.
   *
   * The trace contains four parallel arrays:
   *   - `resources` — script URLs
   *   - `frames` — call-frame descriptors (name, resourceId, line, column)
   *   - `stacks` — stack entries (frameId, parentId)
   *   - `samples` — timestamped stack snapshots (timestamp, stackId)
   *
   * [was: logTrace]
   *
   * @param {ProfilerTrace} trace
   */
  logTrace(trace) { // was: logTrace(Q)
    const resources = [];     // was: c
    const frames = [];        // was: W
    const samples = [];       // was: m
    const stacks = [];        // was: K

    let id = 0; // was: T

    for (const url of trace.resources) {
      resources.push({ id, url });
      id++;
    }

    id = 0;
    for (const { name, resourceId, line, column } of trace.frames) {
      frames.push({ id, name, resourceId, line, column });
      id++;
    }

    id = 0;
    for (const { frameId, parentId } of trace.stacks) {
      stacks.push({ id, frameId, parentId });
      id++;
    }

    id = 0;
    for (const { timestamp, stackId } of trace.samples) {
      samples.push({ id, timestampMs: timestamp, stackId });
      id++;
    }

    const serialised = g.lj(
      serializeMessage({ resources, frames, samples, stacks }, T20),
      4,
    ); // was: g.lj(g.yu({...}, T20), 4)

    this.accumulatedSize += serialised.length;

    // Cap at 10 MB to avoid unbounded memory growth.
    if (this.accumulatedSize < 10_000_000) {
      this.traceChunks.push(serialised);
    }
  }

  /** @override Tear down the profiler. [was: WA] */
  dispose() { // was: WA()
    this.stop();
    super.dispose();
  }
}


// ============================================================================
// Constants
// ============================================================================

/**
 * Cobalt CPU-usage measurement intervals (seconds).
 * [was: hFn]
 */
export const COBALT_CPU_INTERVALS = [2, 5, 30]; // was: hFn

/**
 * Lazy-initialised WebGL renderer string (underscores replace spaces/colons).
 * [was: g.mH]
 */
export const getWebGLRenderer = a_(() => { // was: g.mH = a_(...)
  let renderer = '';
  try {
    const canvas = createElement('CANVAS').getContext('webgl');
    if (canvas) {
      canvas.getExtension('WEBGL_debug_renderer_info');
      renderer = canvas.getParameter(37446);           // UNMASKED_RENDERER_WEBGL
      renderer = renderer.replace(/[ :]/g, '_');
    }
  } catch (_) { /* swallow */ }
  return renderer;
});


// ============================================================================
// QoeStateTracker (partial)  [was: g.ji]
// ============================================================================

/**
 * Master QoE (Quality of Experience) state machine — aggregates playback
 * health metrics, timing counters, format stats, and uploads them via the
 * `/api/stats/qoe` endpoint.
 *
 * Only the constructor and field declarations are reproduced here; the full
 * reporting logic spans hundreds of additional lines beyond the extracted range.
 *
 * [was: g.ji]
 *
 * @extends Disposable
 */
export class QoeStateTracker extends Disposable { // was: g.ji
  /**
   * @param {object} provider [was: Q] — data provider interface
   */
  constructor(provider) {
    super();

    /** @type {object} Data provider. [was: provider] */
    this.provider = provider; // was: this.provider = Q

    /** @private QoE logger instance. [was: logger] */
    this.logger = createLogger('qoe'); // was: new g.JY("qoe")

    /** @type {Map<string, Array>} Key → value list for QoE fields. [was: W] */
    this.fieldMap = new Map(); // was: this.W = new Map

    /** @type {number} Sequence number for QoE pings. [was: sequenceNumber] */
    this.sequenceNumber = 1;

    /** @type {number} Format checkpoint. [was: mF] */
    this.formatCheckpoint = NaN;

    /** @type {string} GPU decode state ("N" = none). [was: GU] */
    this.gpuDecodeState = 'N'; // was: this.GU = "N"

    /** @type {number} Various timing accumulators. [was: A, Y, yZ, Pl, J] */
    this.timingA = 0;
    this.timingY = 0;
    this.timingYz = 0;
    this.timingPl = 0;
    this.timingJ = 0;

    /** @type {string} Concatenated QoE strings. [was: qQ, MM, Ka, WB] */
    this.qoeStringQQ = '';
    this.qoeStringMM = '';
    this.qoeStringKa = '';
    this.qoeStringWB = '';

    /** @type {number} Join gap / server clock. [was: jG, sC] */
    this.joinGap = NaN;
    this.serverClock = NaN;

    /** @type {number} Impression counter. [was: iX] */
    this.impressionCount = 0;

    /** @type {number} Previous sequence number. [was: Xw] */
    this.prevSequenceNumber = -1;

    /** @type {number} Multiplier / weight. [was: MQ] */
    this.multiplier = 1;

    /** @type {number} Accumulated play-time and rebuffer-time (seconds). */
    this.playTimeSecs = 0;
    this.rebufferTimeSecs = 0;

    /** @type {boolean} Various boolean flags. */
    this.isBuffering = false;   // was: this.isBuffering = !1
    this.isOffline = false;     // was: this.isOffline = !1
    this.isEmbargoed = false;   // was: this.isEmbargoed = !1
    this.hasJoined = false;     // was: this.T2 = !1 (named La below)
    this.isFlagLa = false;      // was: this.La = !1

    /** @type {Array} Debug diagnostic entries. [was: d3] */
    this.diagnostics = [];

    /** @type {?object} Live-edge info. [was: L] */
    this.liveEdgeInfo = null;

    /** @type {boolean} Internal flags. [was: D, b0, K, JJ, UH] */
    this.flagD = false;
    this.flagB0 = false;
    this.flagK = false;
    this.flagJJ = false;
    this.flagUH = false;

    /** @type {number} Join-time marker. [was: j] */
    this.joinTimeMarker = -1;

    /** @private Debounced stats-flush timer (750 ms). [was: Sh] */
    this.flushTimer = new Timer(this.u3, 750, this); // was: new g.Uc(this.u3, 750, this)

    /** @type {string} Ad CPN and metadata. [was: adCpn, MH] */
    this.adCpn = '';
    this.adMetaHash = ''; // was: this.MH = ""

    /** @type {?string} Ad format and associated descriptors. [was: adFormat, jo, QD, YV, RO] */
    this.adFormat = undefined;
    this.adJoinOrigin = undefined;    // was: this.jo
    this.adQualityDesc = undefined;   // was: this.QD
    this.adYieldValue = undefined;    // was: this.YV
    this.adRollOrigin = undefined;    // was: this.RO

    /** @type {number} Hardware concurrency counter. [was: Hw] */
    this.hwCounter = 0;

    /**
     * Set of "always-send" QoE field keys.
     * [was: QE]
     */
    this.alwaysSendFields = new Set(
      'cl fexp drm drm_system drm_product ns adformat live cat shbpslc'.split(' '),
    );

    /**
     * Set of "gate" field keys (only sent under specific conditions).
     * [was: gA]
     */
    this.gateFields = new Set(['gd', 'pw', 'gp', 'gm', 'dd']);

    /** @type {string} Serialised house-brand player service logging context. */
    this.serializedHouseBrandPlayerServiceLoggingContext = '';

    /** @type {boolean} [was: Y0] */
    this.flagY0 = false;

    /** @type {number} Firmware / platform hint. [was: Fw] */
    this.firmwareHint = NaN;

    /** @type {number} Retry / error counter. [was: Ie] */
    this.retryCount = 0;

    /** @type {boolean} [was: Re] */
    this.flagRe = false;

    /** @type {Array<string>} Remote connected device IDs. */
    this.remoteConnectedDevices = [];

    /** @type {?string} Remote control mode. */
    this.remoteControlMode = undefined;

    /** @type {boolean} [was: EC] */
    this.flagEC = false;

    /** @type {Set<string>} Active notification channels. [was: nO] */
    this.activeNotifications = new Set();

    /** @type {boolean} [was: HA] */
    this.flagHA = false;

    /**
     * Callback / accessor bag exposed to sub-systems.
     * [was: Rk]
     */
    this._accessors = {
      reportField: (field) => { this.bf(field); },            // was: bf
      getActiveProfile: () => this.O,                          // was: yFA
      reportStats: () => { this.reportStats(); },              // was: reportStats
      getCategoryFields: () => this.fieldMap.get('cat') || [], // was: S7C
      getField: (key) => this.fieldMap.get(key) || [],         // was: Zz
      getAllFields: () => this.fieldMap,                        // was: RJe
      getAdInfo: () => ({                                      // was: cAG
        adCpn: this.adCpn,
        MH: this.adMetaHash,
        adFormat: this.adFormat,
      }),
      getAdDescriptors: () => ({                               // was: Zk2
        jo: this.adJoinOrigin,
        QD: this.adQualityDesc,
        YV: this.adYieldValue,
        /* ... (truncated — continues beyond extracted range) */
      }),
    };
  }
}
