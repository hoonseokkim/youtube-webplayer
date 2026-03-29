/**
 * Seek state machine — seek watchdog, playback state validator,
 * time-sync coordinator, and buffering/seek timeout manager.
 *
 * Extracted from base.js lines 97148–97708.
 *
 * @module seek-state-machine
 */

import { Disposable } from '../core/disposable.js';
import { ObservableTarget } from '../core/event-target.js';
import { compareCueRanges } from '../ads/ad-scheduling.js'; // was: g.yq
import { userAgentContains } from '../core/composition-helpers.js'; // was: g.Hn
import { reportWarning } from '../data/gel-params.js'; // was: g.Ty
import { isTvHtml5 } from '../data/performance-profiling.js'; // was: g.AI
import { isShortsPage } from '../features/autoplay.js'; // was: g.oZ
import { PlayerError } from '../ui/cue-manager.js'; // was: g.rh
import { invokeUnaryRpc } from './bitstream-reader.js'; // was: BG
import { ManifestTracker } from './manifest-handler.js'; // was: UR3
import { ErrorFormatter } from './error-handler.js'; // was: x91
import { findAncestor } from '../core/dom-listener.js'; // was: Ls
import { recordErrorSnapshot } from './engine-config.js'; // was: kJX
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { SYM_VALUE } from '../proto/message-setup.js'; // was: vk
import { getThroughputWatermark } from '../player/time-tracking.js'; // was: Tw()
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { getOwnerDocument } from '../player/video-loader.js'; // was: V4
import { truncateValue } from '../data/gel-params.js'; // was: FY
import { actionCompanionAdRenderer } from '../core/misc-helpers.js'; // was: zm
import { executeCommand } from '../ads/ad-scheduling.js'; // was: xA
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { getSeekableRangeStart } from '../player/time-tracking.js'; // was: bC()
import { isPositionBuffered } from './source-buffer.js'; // was: Zu7
import { isTimeInRange } from './codec-helpers.js'; // was: zb
import { isLoaderAvailable } from '../player/time-tracking.js'; // was: A_()
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { isActivelyPlaying } from './source-buffer.js'; // was: Uj
import { findRangeIndex } from './codec-helpers.js'; // was: hm
import { getRangeStart } from './codec-helpers.js'; // was: B2n
import { iterateCursor } from '../data/idb-transactions.js'; // was: zE
import { checkAdExperiment } from '../player/media-state.js'; // was: qP
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { getRemainingInRange } from './codec-helpers.js'; // was: RR
import { LatencyTimer } from '../data/logger-init.js'; // was: DB
import { disableSsdai } from '../ads/ad-cue-delivery.js'; // was: pE
import { appendErrorArgs } from '../data/gel-params.js'; // was: wn
import { getStreamTimeOffsetNQ } from '../player/time-tracking.js'; // was: NQ()
import { getInMemoryStore } from '../data/gel-core.js'; // was: vm
import { concat, filter, clear } from '../core/array-utils.js';
import { getPlayerState } from '../player/playback-bridge.js';
import { getPlaybackRate, getSeekableStart, getCurrentTime } from '../player/time-tracking.js';
import { forEach } from '../core/event-registration.js';
import { seekTo } from '../ads/dai-cue-range.js';
// TODO: resolve g.S4
// TODO: resolve g.h
// TODO: resolve g.pl

// ---------------------------------------------------------------------------
// SeekWatchdog — monitors playback-quality events during seeks
// ---------------------------------------------------------------------------

/**
 * Seek timeout watchdog. Aggregates QoE reporters and canary diagnostics
 * for the active video and delegates progress/error/rate-change events.
 *
 * [was: g.fi]  (line 97148)
 * Extends Disposable [was: g.qK].
 *
 * Instance properties:
 *   provider     [was: provider]  — provider/player reference
 *   qoeMap       [was: A]         — Map<cpn, progressReporter>
 *   playerState  [was: GU]        — g.In (PlayerState)
 *   delegates    [was: Rk]        — {qoe, progress, canary} accessors
 *   progressReporter [was: W]     — UR3 instance for non-DAI playback
 *   qoeReporter  [was: qoe]       — g.ji QoE reporter
 *   canaryDiag   [was: O]         — x91 canary diagnostics (if canary/holdback)
 *   activeCpn    [was: vG]        — clientPlaybackNonce for server-stitched DAI
 */
export class SeekWatchdog extends Disposable { // was: g.fi
  constructor(provider) { // was: Q
    super();
    this.provider = provider; // was: this.provider = Q
    this.qoeMap = new Map(); // was: this.A = new Map
    this.playerState = null; // was: this.GU = new g.In (placeholder — real init uses g.In)
    this.delegates = { // was: this.Rk
      getQoe: () => this.qoeReporter, // was: l5G: () => this.qoe
      getProgress: () => this.progressReporter, // was: bry: () => this.W
      getCanary: () => this.canaryDiag, // was: AFA: () => this.O
    };

    // Initialise progress & QoE reporters when video data is valid and not BG
    if (this.provider.videoData.Xq() && !this.provider.videoData.invokeUnaryRpc) {
      this.progressReporter = new ManifestTracker(this.provider); // was: this.W = new UR3(…)
      this.progressReporter.j = 0; // was: this.W.j = 0
      // g.F(this, this.progressReporter) — register for cascading disposal
      this.qoeReporter = null; // was: this.qoe = new g.ji(…)
      // g.F(this, this.qoeReporter)

      // For server-stitched DAI, track by CPN
      if (this.provider.videoData.enableServerStitchedDai) {
        this.activeCpn = this.provider.videoData.clientPlaybackNonce; // was: this.vG
        if (this.activeCpn) {
          this.qoeMap.set(this.activeCpn, this.progressReporter);
        }
      }
    }

    // Canary diagnostics when player is in canary or holdback state
    const canaryState = provider.FI.playerCanaryState; // was: Q.FI.playerCanaryState
    if (canaryState === 'canary' || canaryState === 'holdback') {
      this.canaryDiag = new ErrorFormatter(this.provider); // was: this.O = new x91(…)
      // g.F(this, this.canaryDiag)
    }
  }

  /**
   * Notify reporters that loading/seek has started.
   * [was: Ls]
   */
  notifyLoadStart() { // was: Ls
    this.progressReporter?.findAncestor();
    this.canaryDiag?.findAncestor();
  }

  /**
   * Forward progress event to the appropriate reporter.
   * For server-stitched DAI, routes by CPN; otherwise uses the default reporter.
   * [was: onProgress]
   */
  onProgress() { // was: onProgress
    if (this.provider.videoData.enableServerStitchedDai && this.activeCpn) {
      this.qoeMap.get(this.activeCpn)?.onProgress();
    } else if (this.progressReporter) {
      this.progressReporter.onProgress();
    }
  }

  /** [was: F9] */
  F9(data) { // was: Q
    this.qoeReporter?.F9(data);
  }

  /** [was: Gb] */
  Gb(a, b) { // was: Q, c
    this.qoeReporter?.Gb(a, b);
  }

  /**
   * Mark reporting boundary (e.g. end of segment).
   * [was: V2]
   */
  markBoundary() { // was: V2
    if (this.provider.videoData.enableServerStitchedDai && this.activeCpn) {
      this.qoeMap.get(this.activeCpn)?.Y();
    } else {
      this.progressReporter?.Y();
    }
  }

  /**
   * Report an error to QoE and canary diagnostics.
   * [was: I$]
   *
   * @param {*} errorCode [was: Q]
   * @param {*} errorInfo [was: c]
   */
  onError(NetworkErrorCode, errorInfo) { // was: I$
    this.qoeReporter && recordErrorSnapshot(this.qoeReporter, NetworkErrorCode, errorInfo);
    if (this.canaryDiag) {
      this.canaryDiag.onError(NetworkErrorCode);
    }
  }

  /**
   * QoE observation update — "M" or "A" channels.
   * [was: O2]
   *
   * @param {string} channel [was: Q] — "M" or "A"
   * @param {*} value [was: c]
   */
  onObservation(channel, value) { // was: O2
    switch (channel) {
      case 'M':
        this.qoeReporter?.O2(channel, value);
        break;
      case 'A':
        this.qoeReporter?.O2(channel);
        break;
    }
  }

  /**
   * Handle playback-rate changes: forward to QoE, reset progress boundary.
   * [was: onPlaybackRateChange]
   *
   * @param {number} rate [was: Q]
   */
  onPlaybackRateChange(rate) { // was: onPlaybackRateChange
    this.qoeReporter?.onPlaybackRateChange(rate);
    this.progressReporter?.Y();
  }

  /** [was: tJ] */
  RetryTimer(a, b, c) { this.qoeReporter?.RetryTimer(a, b, c); }

  /** [was: vk] */
  SYM_VALUE(a, b, c) { this.qoeReporter?.SYM_VALUE(a, b, c); }

  /** [was: zk] */
  zk(a) { this.qoeReporter?.zk(a); }

  /** [was: tL] */
  tL(a) { this.qoeReporter?.tL(a); }

  /** [was: NS] */
  NS(a, b, c, d) { this.qoeReporter?.NS(a, b, c, d); }

  /** [was: Kg] */
  Kg(a) { this.qoeReporter?.Kg(a); }

  /** [was: gN] */
  gN(a, b, c) { this.qoeReporter?.gN(a, b, c); }

  /** [was: Tw] — returns QoE timing data. */
  getTimingData() { // was: Tw
    if (this.qoeReporter) return this.qoeReporter.getThroughputWatermark;
  }

  /**
   * Returns watchdog analytics payload.
   * [was: wA]
   *
   * @returns {Object}
   */
  getAnalytics() { // was: wA
    if (this.provider.videoData.enableServerStitchedDai && this.activeCpn) {
      return this.qoeMap.get(this.activeCpn)?.isGaplessShortEligible() ?? {};
    }
    return this.progressReporter ? this.progressReporter.isGaplessShortEligible() : {};
  }

  /** [was: V4] */
  getOwnerDocument() { return this.qoeReporter?.getOwnerDocument(); }

  /** [was: FY] */
  truncateValue(a, b) { this.qoeReporter?.truncateValue(a, b); }

  /**
   * Returns a scoped measurement callback.
   * [was: zm]
   *
   * @param {*} key [was: Q]
   * @returns {Function}
   */
  getScopedMeasure(key) { // was: zm
    return this.progressReporter ? this.progressReporter.actionCompanionAdRenderer(key) : () => {};
  }

  /** [was: getVideoData] */
  getVideoData() {
    return this.provider.videoData;
  }

  /** [was: resume] */
  resume() {
    this.qoeReporter?.resume();
  }
}

// Prototype-level feature-flag selectors (lazy init via c3 factory)
// was: g.fi.prototype.D0 = c3(49);
// was: g.fi.prototype.SQ = c3(32);
// was: g.fi.prototype.q6 = c3(26);
// was: g.fi.prototype.f2 = c3(20);

// ---------------------------------------------------------------------------
// D9v — Seek snapshot data (bandwidth / time estimates)
// ---------------------------------------------------------------------------

/**
 * Stores a snapshot of seek-related metrics: bandwidth, segment timing, etc.
 * [was: D9v]  (line 97256)
 */
export class SeekSnapshot { // was: D9v
  constructor() {
    this.state = 0; // was: qH
    this.duration = NaN; // was: j
    this.startTime = NaN; // was: A
    this.endTime = NaN; // was: f7
    this.seekTarget = NaN; // was: Ry
    this.currentTime = NaN; // was: O
    this.metadata = {}; // was: W
    this.bandwidthEstimate = NaN; // was: bandwidthEstimate
  }
}

// ---------------------------------------------------------------------------
// t4o — sorted cue-range array wrapper
// ---------------------------------------------------------------------------

/**
 * Maintains a sorted array of cue ranges for the PlaybackStateValidator.
 * [was: t4o]  (line 97265)
 */
class SortedCueRangeArray { // was: t4o
  constructor() {
    this.comparator = compareCueRanges; // was: this.W = g.yq — default sort comparator
    this.array = []; // was: this.array
  }
}

// ---------------------------------------------------------------------------
// PlaybackStateValidator — cue-range sync & activation engine
// ---------------------------------------------------------------------------

/**
 * Playback state validator. Manages cue ranges (timed metadata / ads / captions)
 * and synchronises their active state with the current playback time.
 *
 * [was: g.vL]  (line 97272)
 * Extends Disposable [was: g.qK].
 *
 * @param {Object} player [was: Q / this.EH] — player interface
 * @param {Function} callback [was: c / this.J] — on-cue-enter/exit callback
 */
export class PlaybackStateValidator extends Disposable { // was: g.vL
  constructor(player, callback) { // was: Q, c
    super();
    this.player = player; // was: this.EH
    this.callback = callback; // was: this.J
    this.cachedTime = NaN; // was: this.A — cached playback time
    this.started = false; // was: this.started = !1
    this.syncing = false; // was: this.D = !1
    this.dirty = false; // was: this.K = !1
    this.activeCues = []; // was: this.O — currently-active cue ranges
    this.syncTimer = null; // was: this.L = new g.Uc(this.sync, 250, this) — 250 ms debounce
    // g.F(this, this.syncTimer)
    this.immediateSyncTimer = null; // was: this.j = new g.Uc(this.sync, 0, this) — immediate
    // g.F(this, this.immediateSyncTimer)
    this.cueRanges = new SortedCueRangeArray(); // was: this.W = new t4o
  }

  /**
   * Merge new cue ranges into the sorted array.
   * Trims captions beyond 2 000 entries by pruning stale cues.
   * [was: mV]
   *
   * @param {Array} cues [was: Q] — cue range objects to add
   * @param {boolean} isCaptions [was: c] — whether these are captions
   */
  addCueRanges(cues, isCaptions) { // was: mV
    this.sync();
    if (isCaptions && this.cueRanges.array.length >= 2000) {
      this.pruneOld('captions', 10000); // was: this.Ks("captions", 1E4)
    }
    const arr = this.cueRanges; // was: c (re-assigned)
    if (cues.length > 1 && cues.length > arr.array.length) {
      arr.array = arr.array.concat(cues);
      arr.array.sort(arr.comparator);
    } else {
      for (const cue of cues) { // was: for (const W of Q)
        if (!arr.array.length || arr.comparator(cue, arr.array[arr.array.length - 1]) > 0) {
          arr.array.push(cue);
        } else {
          g.S4(arr.array, cue, arr.comparator); // binary insert
        }
      }
    }
    this.cachedTime = NaN;
    this.sync();
  }

  /**
   * Remove a set of cue ranges.
   * [was: bc]
   *
   * @param {Array} cues [was: Q]
   */
  removeCueRanges(cues) { // was: bc
    if (cues.length > 10000) {
      reportWarning(new PlayerError('Over 10k cueRanges removal occurs with a sample: ', cues[0]));
    }
    if (!this.isDisposed()) { // was: !this.u0()
      const set = new Set(cues); // was: c
      this.activeCues = this.activeCues.filter(cue => !set.has(cue)); // was: this.O
      DR3(this.cueRanges, set); // was: DR3(this.W, c)
      this.sync();
    }
  }

  /**
   * Remove a cue range by namespace (first with no id).
   * [was: PP]
   *
   * @param {string} namespace [was: Q]
   */
  removeByNamespace(namespace) { // was: PP
    if (!this.isDisposed()) {
      const cue = this.getAllCues().find(c => c.id === undefined && c.namespace === namespace);
      if (cue) this.removeCueRanges([cue]);
    }
  }

  /**
   * Prune cue ranges older than (currentTime - threshold) for a given namespace.
   * [was: Ks]
   *
   * @param {string} namespace [was: Q]
   * @param {number} thresholdMs [was: c]
   * @returns {Array} Removed cues
   */
  pruneOld(namespace, thresholdMs) { // was: Ks
    const cutoff = (isNaN(this.cachedTime) ? tm_(this) : this.cachedTime) - thresholdMs; // was: W
    const stale = this.getAllCues().filter(cue => cue.namespace === namespace && cue.end < cutoff);
    this.removeCueRanges(stale);
    return stale;
  }

  /**
   * Return all cue ranges (empty if disposed).
   * [was: gj]
   *
   * @returns {Array}
   */
  getAllCues() { // was: gj
    return this.isDisposed() ? [] : this.cueRanges.array;
  }

  /**
   * Reset all cue state.
   * [was: reset]
   */
  reset() {
    this.started = false;
    this.immediateSyncTimer?.stop(); // was: this.j.stop()
    this.cueRanges.array = [];
    this.activeCues = [];
    this.sync();
  }

  /**
   * Remove and return all cues for a given namespace.
   * [was: qI]
   *
   * @param {string} namespace [was: Q]
   * @returns {Array}
   */
  removeAllForNamespace(namespace) { // was: qI
    const cues = this.getAllCues().filter(c => c.namespace === namespace);
    this.removeCueRanges(cues);
    return cues;
  }

  /**
   * Deactivate cues belonging to a specific associated clip ID (end-of-clip).
   * [was: WS]
   *
   * @param {string} clipId [was: Q]
   * @returns {number} Number of cues deactivated
   */
  deactivateForClip(clipId) { // was: WS
    let exitCallbacks = []; // was: c
    const infinityCues = RA(this.cueRanges, 0x7ffffffffffff); // was: W
    const matchingCues = []; // was: m
    for (const cue of infinityCues) { // was: K
      if (cue.active && clipId === cue.associatedClipId) {
        matchingCues.push(cue);
      }
    }
    exitCallbacks = exitCallbacks.concat(kz(this, matchingCues));
    Yz(this, exitCallbacks);

    exitCallbacks = [];
    const activeSentinels = []; // was: W (re-used)
    for (const cue of this.activeCues) { // was: K
      if (cue.active && cue.associatedClipId === clipId && cue.start === 0x7ffffffffffff) {
        activeSentinels.push(cue);
      }
    }
    exitCallbacks = exitCallbacks.concat(pw(this, activeSentinels));
    Yz(this, exitCallbacks);
    return matchingCues.length;
  }

  /**
   * Remove all cues for a clip ID.
   * [was: w1]
   *
   * @param {string} clipId [was: Q]
   */
  removeForClip(clipId) { // was: w1
    const infinityCues = RA(this.cueRanges, 0x7ffffffffffff);
    const toRemove = [];
    for (const cue of infinityCues) {
      if (cue.active && clipId === cue.associatedClipId) {
        toRemove.push(cue);
      }
    }
    this.removeCueRanges(toRemove);
  }

  /**
   * Core sync loop — reconciles active cue ranges with current playback time.
   * Runs up to 3 iterations to settle re-entrant changes.
   * Schedules the next sync via timer if still playing.
   * [was: sync]
   */
  sync() { // was: sync
    this.dirty = true; // was: this.K = !0
    if (!this.syncing) { // was: if (!this.D)
      let iterations = 3; // was: Q
      while (this.dirty && iterations) {
        this.dirty = false;
        this.syncing = true;
        HlW(this); // was: HlW(this) — reconcile cue activations
        this.syncing = false;
        iterations--;
      }
      // Schedule next sync based on nearest cue boundary
      if (this.player.getPlayerState().isPlaying()) {
        const nextTime = nQO(this.cueRanges, this.cachedTime); // was: Q
        if (!isNaN(nextTime) && nextTime < 0x7ffffffffffff) {
          const delay = (nextTime - this.cachedTime) / this.player.getPlaybackRate(); // was: Q
          this.immediateSyncTimer?.start(delay);
        }
      }
    }
  }

  /**
   * Determines whether playback has ended, accounting for pseudo-gapless shorts.
   * [was: isEnded]
   *
   * @param {Object} state [was: Q] — player state
   * @param {number} remainingMs [was: c]
   * @returns {boolean}
   */
  isEnded(state, remainingMs) { // was: isEnded
    const timeToEnd = this.player.qE() * 1000 - remainingMs; // was: c (reassigned)
    const nearEnd = this.player.bS() && state.W(1) && timeToEnd < 500;
    return state.W(2) || (this.player.G().X('html5_pseudogapless_shorts') && nearEnd);
  }

  /**
   * Dispose internal state.
   * [was: WA]
   */
  disposeInternal() { // was: WA
    this.activeCues = [];
    this.cueRanges.array = [];
    super.disposeInternal();
  }
}

// was: g.vL.prototype.h2 = c3(38);

// ---------------------------------------------------------------------------
// Hma — Media time tracking state
// ---------------------------------------------------------------------------

/**
 * Tracks the relationship between wall-clock and media time with a small
 * tolerance for drift (1 ms default, 10 ms on smart TVs).
 * [was: Hma]  (line 97385)
 *
 * @param {Object} config [was: Q / this.FI]
 */
export class MediaTimeTracker { // was: Hma
  constructor(config) { // was: Q
    this.config = config; // was: this.FI
    this.mediaTime = NaN; // was: this.mediaTime
    this.lastSyncTime = NaN; // was: this.O
    this.seekTarget = NaN; // was: this.A
    this.isSeeking = false; // was: this.W = !1
    this.pendingSeek = false; // was: this.j = !1
    this.driftTolerance = 0.001; // was: this.K = .001
    if (isTvHtml5(config)) { // smart-TV detection
      this.driftTolerance = 0.01; // was: this.K = .01
    }
  }
}

// ---------------------------------------------------------------------------
// NAx — Video data + policy pair
// ---------------------------------------------------------------------------

/**
 * Bundles video data with a policy reference (used for seek decisions).
 * [was: NAx]  (line 97395)
 */
export class VideoDataPolicy { // was: NAx
  constructor(videoData, policy) { // was: Q, c
    this.videoData = videoData; // was: this.videoData
    this.policy = policy; // was: this.W
  }
}

// ---------------------------------------------------------------------------
// NZH — Ring buffer (Float32Array-backed)
// ---------------------------------------------------------------------------

/**
 * Fixed-size ring buffer backed by Float32Array (with Array fallback).
 * Used for rolling metric samples (jitter, bandwidth snapshots, etc.).
 * [was: NZH]  (line 97402)
 *
 * @param {number} size — capacity of the ring buffer
 */
export class RingBuffer { // was: NZH
  constructor(size) { // was: Q
    this.data = globalThis.Float32Array
      ? new Float32Array(size)
      : Array(size); // was: window.Float32Array ? new Float32Array(Q) : Array(Q)
    this.writeIndex = size - 1; // was: this.W = Q - 1
    this.readIndex = size - 1; // was: this.O = Q - 1
  }

  /**
   * Append a value, advancing the write pointer.
   * [was: add]
   *
   * @param {number} value [was: Q]
   */
  add(value) { // was: add
    this.writeIndex = (this.writeIndex + 1) % this.data.length; // was: this.W
    this.data[this.writeIndex] = value;
  }

  /**
   * Return the most-recently written value (or 0).
   * [was: A]
   *
   * @returns {number}
   */
  latest() { // was: A
    return this.data[this.writeIndex] || 0;
  }

  /**
   * Iterate all values in insertion order (oldest to newest).
   * [was: forEach]
   *
   * @param {Function} fn [was: Q]
   */
  forEach(fn) { // was: forEach
    for (let i = this.writeIndex + 1; i < this.data.length; i++) { // was: c
      fn(this.data[i] || 0);
    }
    for (let i = 0; i <= this.writeIndex; i++) {
      fn(this.data[i] || 0);
    }
  }

  /**
   * Drain unread values (from readIndex to writeIndex).
   * [was: j]
   *
   * @returns {number[]}
   */
  drain() { // was: j
    const values = []; // was: Q
    while (this.readIndex !== this.writeIndex) {
      this.readIndex = (this.readIndex + 1) % this.data.length;
      values.push(this.data[this.readIndex]);
    }
    return values;
  }

  /**
   * Zero-fill the entire buffer and reset cursors.
   * [was: clear]
   */
  clear() {
    const len = this.data.length; // was: Q
    for (let i = 0; i < len; i++) { // was: c
      this.data[i] = 0;
    }
    this.readIndex = this.writeIndex = this.data.length - 1;
  }
}

// ---------------------------------------------------------------------------
// gQO — Bandwidth sampler (50-sample ring)
// ---------------------------------------------------------------------------

/**
 * Lightweight bandwidth estimator wrapping a 50-sample RingBuffer.
 * [was: gQO]  (line 97435)
 *
 * @param {*} context [was: Q / this.K]
 */
export class BandwidthSampler { // was: gQO
  constructor(context) { // was: Q
    this.context = context; // was: this.K
    this.totalBytes = 0; // was: this.O
    this.totalTime = 0; // was: this.A
    this.samples = new RingBuffer(50); // was: this.j = new NZH(50)
  }
}

// ---------------------------------------------------------------------------
// TimeSyncCoordinator — live-stream time synchronisation
// ---------------------------------------------------------------------------

/**
 * Coordinates time synchronisation for live streams: maps server-side
 * "chunk readahead" into a playback window, respects latency-class
 * constraints, and enforces experiment-driven readahead bounds.
 *
 * [was: Ol_]  (line 97443)
 * Extends ObservableTarget [was: g.W1].
 *
 * @param {Object} videoData [was: Q] — video metadata
 * @param {Object} experiments [was: c] — experiment-flag accessor
 * @param {Function} wallClockProvider [was: W / this.K] — returns wall-clock seconds
 */
export class TimeSyncCoordinator extends ObservableTarget { // was: Ol_
  constructor(videoData, experiments, wallClockProvider) { // was: Q, c, W
    super();
    this.videoData = videoData; // was: this.videoData
    this.experiments = experiments; // was: this.experiments
    this.wallClockProvider = wallClockProvider; // was: this.K

    this.pendingUpdates = []; // was: this.O
    this.updateCount = 0; // was: this.rJ
    this.isLive = true; // was: this.A = !0
    this.isSynced = false; // was: this.j = !1
    this.driftCorrections = 0; // was: this.D

    // Build the readahead policy
    const policy = new LiveReadaheadPolicy(); // was: W = new imZ
    if (videoData.latencyClass === 'ULTRALOW') {
      policy.allowDrift = false; // was: W.L = !1
    }
    if (videoData.executeCommand) {
      policy.sourceType = 3; // was: W.A = 3
    } else if (g.pl(videoData)) {
      policy.sourceType = 2; // was: W.A = 2
    }
    if (videoData.latencyClass === 'NORMAL') {
      policy.enableLiveSync = true; // was: W.K = !0
    }
    policy.isManifestFetched = shouldUseSabr(videoData); // was: W.mF = M8(Q)
    if (videoData.latencyClass === 'LOW' || videoData.latencyClass === 'ULTRALOW') {
      policy.enableLiveSync = true; // was: W.K = !0
    }

    // Liveness drift override from experiments
    let driftOverride = getExperimentValue(experiments, 'html5_liveness_drift_proxima_override'); // was: m
    if (hh(videoData) !== 0 && driftOverride) {
      policy.driftChunks = driftOverride; // was: W.W = m
      if (videoData.W?.XI()) {
        policy.driftChunks--;
      }
    }

    // SABR live metadata boundaries
    if (shouldUseSabr(videoData) && experiments.SG('html5_sabr_parse_live_metadata_playback_boundaries')) {
      policy.useSabrBoundaries = true; // was: W.S = !0
    }

    // Platform minimum readahead (Trident / old Edge)
    if (userAgentContains('trident/') || userAgentContains('edge/')) {
      const platformMin = getExperimentValue(experiments, 'html5_platform_minimum_readahead_seconds') || 3; // was: m
      policy.minReadahead = Math.max(policy.minReadahead, platformMin); // was: W.j
    }

    // Experiment overrides for min/max readahead
    if (getExperimentValue(experiments, 'html5_minimum_readahead_seconds')) {
      policy.minReadahead = getExperimentValue(experiments, 'html5_minimum_readahead_seconds');
    }
    if (getExperimentValue(experiments, 'html5_maximum_readahead_seconds')) {
      policy.maxReadahead = getExperimentValue(experiments, 'html5_maximum_readahead_seconds');
    }

    // Chunk drift override
    const chunkDriftOverride = getExperimentValue(experiments, 'html5_liveness_drift_chunk_override'); // was: c (reused)
    if (chunkDriftOverride) {
      policy.driftChunks = chunkDriftOverride;
    }

    // Low-latency-live adjustments
    if (ub(videoData)) {
      policy.driftChunks = (policy.driftChunks + 1) / 5;
      if (videoData.latencyClass === 'LOW') {
        policy.driftChunks *= 2;
      }
    }

    // Ultra-low / low latency retry/delay limits
    if (shouldUseSabr(videoData) && (videoData.latencyClass === 'ULTRALOW' || videoData.latencyClass === 'LOW')) {
      policy.retryLimit = 3; // was: W.J = 3
      policy.maxBackoff = 25; // was: W.D = 25
    }

    this.policy = policy; // was: this.policy = W
    this.canSyncFromServer = this.policy.sourceType !== 1; // was: this.J = this.policy.A !== 1
    this.readaheadChunks = Wf(this, yhy(this, // was: this.W
      isNaN(videoData.liveChunkReadahead) ? 3 : videoData.liveChunkReadahead,
      videoData
    ));
  }

  /**
   * Whether syncing from server-provided timestamps is possible.
   * [was: kU]
   *
   * @returns {boolean}
   */
  canSync() { // was: kU
    return this.canSyncFromServer;
  }

  /**
   * Compute the start of the seekable range for this live stream.
   * [was: sR]
   *
   * @returns {number} Seconds
   */
  getSeekableStart() { // was: sR
    if (this.policy.useSabrBoundaries && this.videoData.W) {
      return this.videoData.W.Jk;
    }
    return Math.max(
      this.wallClockProvider() - cf(this) * this.readaheadChunks,
      this.videoData.getSeekableRangeStart
    );
  }
}

/**
 * Live readahead policy — default thresholds for live-stream buffering.
 * [was: imZ]  (line 97487)
 */
class LiveReadaheadPolicy { // was: imZ
  constructor() {
    this.minReadahead = 0; // was: this.j = 0
    this.maxReadahead = Infinity; // was: this.Y = Infinity
    this.allowDrift = true; // was: this.L = !0
    this.driftChunks = 2; // was: this.W = 2 (also this.O = 2)
    this.initialDriftChunks = 2; // was: this.O = 2
    this.sourceType = 1; // was: this.A = 1
    this.enableLiveSync = false; // was: this.K = !1
    this.maxBackoff = 10; // was: this.D = 10
    this.useSabrBoundaries = false; // was: this.S = !1
    this.retryLimit = 1; // was: this.J = 1
    this.isManifestFetched = false; // was: this.mF = !1
  }
}

// ---------------------------------------------------------------------------
// TimeoutManager — seek & buffering timeout state machine
// ---------------------------------------------------------------------------

/**
 * Manages multiple timeout-based watchdogs for seek, rebuffer, and startup
 * scenarios. Each watchdog is a {@link TimeoutEntry} that triggers a recovery
 * action (re-seek, jiggle, new element, etc.) when its threshold elapses
 * without progress.
 *
 * [was: yHZ]  (line 97502)
 * Extends Disposable [was: g.qK].
 *
 * Key properties (all TimeoutEntry instances):
 *   seekTimeout              [was: XI]  — html5_seek_timeout_delay_ms
 *   longRebufferThreshold    [was: b0]  — html5_long_rebuffer_threshold_ms
 *   seekSetCmtDelay          [was: HA]  — html5_seek_set_cmt_delay_ms
 *   jiggleDelay              [was: MM]  — html5_seek_jiggle_cmt_delay_ms
 *   newElemDelay             [was: jG]  — html5_seek_new_elem_delay_ms
 *   unreportedReseekDelay    [was: Fw]  — html5_unreported_seek_reseek_delay_ms
 *   longRebufferJiggleDelay  [was: mF]  — html5_long_rebuffer_jiggle_cmt_delay_ms
 *   longRebufferNewElem      [was: S]   — 20 000 ms fixed threshold
 *   shortsNewElemDelay       [was: Ka]  — html5_seek_new_elem_shorts_delay_ms
 *   shortsMediaSourceReuse   [was: UH]  — html5_seek_new_media_source_shorts_reuse_delay_ms
 *   shortsMediaElementReuse  [was: PA]  — html5_seek_new_media_element_shorts_reuse_delay_ms
 *   reseekAfterTimeJump      [was: Ie]  — html5_reseek_after_time_jump_delay_ms
 *   gaplessHandoffLongRebuf  [was: L]   — html5_gapless_handoff_close_end_long_rebuffer_delay_ms
 *   gaplessSlowSeek          [was: Y]   — html5_gapless_slow_seek_delay_ms
 *   shortsGaplessAdSlowStart [was: JJ]  — html5_shorts_gapless_ad_slow_start_delay_ms
 *   shortsGaplessSlowStart   [was: La]  — html5_shorts_gapless_slow_start_delay_ms
 *   adsPrerollTimeout        [was: J]   — html5_ads_preroll_lock_timeout_delay_ms
 *   slowAdReporter           [was: Y0]  — skip-slow-ad reporter (TX)
 *   slowAdBuffering          [was: Re]  — skip-slow-ad-buffering (TX)
 *   slowStartTimeout         [was: EC]  — html5_slow_start_timeout_delay_ms
 *   slowStartNoMse           [was: T2]  — html5_slow_start_no_media_source_delay_ms
 *
 * @param {Object} player [was: Q / this.EH] — player interface
 */
export class TimeoutManager extends Disposable { // was: yHZ
  constructor(player) { // was: Q
    super();
    this.player = player; // was: this.EH
    this.seekTarget = 0; // was: this.W — target time for active seek
    this.seekSource = null; // was: this.O — source identifier for the seek
    this.lastPlaybackTime = 0; // was: this.j — last observed playback time
    this.noProgressStartTime = 0; // was: this.D — time when lack-of-progress started
    this.reportedEvents = {}; // was: this.A — dedup map for reported events
    this.config = this.player.G(); // was: this.FI = this.EH.G()
    this.pollTimer = null; // was: this.K = new g.Uc(this.JF, 1E3, this) — 1 s poll

    // ── Timeout entries (each via oq helper) ──
    this.seekTimeout = oq(this, 'html5_seek_timeout_delay_ms'); // was: XI
    this.longRebufferThreshold = oq(this, 'html5_long_rebuffer_threshold_ms'); // was: b0
    this.seekSetCmtDelay = oq(this, 'html5_seek_set_cmt_delay_ms', 'html5_seek_set_cmt_cfl'); // was: HA
    this.jiggleDelay = oq(this, 'html5_seek_jiggle_cmt_delay_ms', 'html5_seek_jiggle_cmt_cfl'); // was: MM
    this.newElemDelay = oq(this, 'html5_seek_new_elem_delay_ms', 'html5_seek_new_elem_cfl'); // was: jG
    this.unreportedReseekDelay = oq(this, 'html5_unreported_seek_reseek_delay_ms', 'html5_unreported_seek_reseek_cfl'); // was: Fw
    this.longRebufferJiggleDelay = oq(this, 'html5_long_rebuffer_jiggle_cmt_delay_ms', 'html5_long_rebuffer_jiggle_cmt_cfl'); // was: mF
    this.longRebufferNewElem = new TimeoutEntry(20000); // was: this.S = new TX(2E4)
    this.shortsNewElemDelay = oq(this, 'html5_seek_new_elem_shorts_delay_ms', 'html5_seek_new_elem_shorts_cfl'); // was: Ka
    this.shortsMediaSourceReuse = oq(this, 'html5_seek_new_media_source_shorts_reuse_delay_ms', 'html5_seek_new_media_source_shorts_reuse_cfl'); // was: UH
    this.shortsMediaElementReuse = oq(this, 'html5_seek_new_media_element_shorts_reuse_delay_ms', 'html5_seek_new_media_element_shorts_reuse_cfl'); // was: PA
    this.reseekAfterTimeJump = oq(this, 'html5_reseek_after_time_jump_delay_ms', 'html5_reseek_after_time_jump_cfl'); // was: Ie
    this.gaplessHandoffLongRebuf = oq(this, 'html5_gapless_handoff_close_end_long_rebuffer_delay_ms', 'html5_gapless_handoff_close_end_long_rebuffer_cfl'); // was: L
    this.gaplessSlowSeek = oq(this, 'html5_gapless_slow_seek_delay_ms', 'html5_gapless_slow_seek_cfl'); // was: Y
    this.shortsGaplessAdSlowStart = oq(this, 'html5_shorts_gapless_ad_slow_start_delay_ms', 'html5_shorts_gapless_ad_slow_start_cfl'); // was: JJ
    this.shortsGaplessSlowStart = oq(this, 'html5_shorts_gapless_slow_start_delay_ms', 'html5_shorts_gapless_slow_start_cfl'); // was: La
    this.adsPrerollTimeout = oq(this, 'html5_ads_preroll_lock_timeout_delay_ms', 'html5_ads_preroll_lock_timeout_cfl'); // was: J

    const skipSlowAdDelay = getExperimentValue(this.config.experiments, 'html5_skip_slow_ad_delay_ms') || 5000;
    this.slowAdReporter = new TimeoutEntry( // was: Y0
      skipSlowAdDelay,
      !this.config.X('html5_report_slow_ads_as_error')
    );
    this.slowAdBuffering = new TimeoutEntry( // was: Re
      skipSlowAdDelay,
      !this.config.X('html5_skip_slow_buffering_ad')
    );
    this.slowStartTimeout = oq(this, 'html5_slow_start_timeout_delay_ms'); // was: EC
    this.slowStartNoMse = oq(this, 'html5_slow_start_no_media_source_delay_ms', 'html5_slow_start_no_media_source_cfl'); // was: T2

    // Register poll timer for cascading disposal
    // g.F(this, this.pollTimer)
  }

  /**
   * Core monitoring tick — checks every active watchdog against current
   * playback state and fires recovery actions when thresholds are exceeded.
   *
   * Runs on a 1-second poll interval. Evaluates:
   *   1. Seek timeout (no progress after seek)
   *   2. Re-seek with set currentTime (stalled seek with buffered data)
   *   3. Jiggle seek (tiny offset re-seek for stuck decoders)
   *   4. New element creation (when jiggle is insufficient)
   *   5. Long rebuffer detection & escalation
   *   6. Ads preroll lock timeout
   *   7. Slow-start / no-MSE scenarios
   *
   * [was: JF]  (line 97535)
   */
  monitor() { // was: JF
    const mediaElement = this.player.Yx(); // was: Q
    const playerState = this.player.getPlayerState(); // was: c

    if (!mediaElement || playerState.isError()) return;

    const currentTime = mediaElement.getCurrentTime(); // was: W
    const isProgressingNormally = playerState.O() && currentTime > this.seekTarget; // was: m
    const isSeeking = playerState.W(8) && playerState.W(16); // was: K
    const isBackgroundOrSuspended = this.player.OV().isBackground() || playerState.isSuspended(); // was: T

    // ── 1. Seek timeout ──
    r3(this, this.seekTimeout, isSeeking && !isBackgroundOrSuspended,
      isProgressingNormally, 'qoe.slowseek', () => {}, 'timeout');

    // ── 2. Re-seek with set currentTime ──
    const seekTargetFinite = isFinite(this.seekTarget); // was: r
    const hasBufferedData = seekTargetFinite && isPositionBuffered(mediaElement, this.seekTarget); // was: r (reassigned)
    const isLargeSeek = !currentTime || Math.abs(currentTime - this.seekTarget) > 10; // was: U
    const excludeInitialSabrSeek = this.config.X('html5_exclude_initial_sabr_live_dvr_seek_in_watchdog'); // was: I
    const isInitialSabrSeek = currentTime === 0 && this.seekSource && [11, 10].includes(this.seekSource); // was: X

    r3(this, this.seekSetCmtDelay,
      hasBufferedData && isLargeSeek && !isBackgroundOrSuspended && (!excludeInitialSabrSeek || !isInitialSabrSeek),
      isProgressingNormally, 'qoe.slowseek', () => {
        mediaElement.seekTo(this.seekTarget);
      }, 'set_cmt');

    // ── 3. Jiggle seek ──
    const isBufferedAtTarget = seekTargetFinite && isTimeInRange(mediaElement.pU(), this.seekTarget); // was: U (reassigned)
    const loader = this.player.loader; // was: A
    const loaderReady = !loader || loader.isLoaderAvailable; // was: r
    const jiggleAction = () => { mediaElement.seekTo(this.seekTarget + 0.001); }; // was: e

    r3(this, this.jiggleDelay, isBufferedAtTarget && loaderReady && !isBackgroundOrSuspended,
      isProgressingNormally, 'qoe.slowseek', jiggleAction, 'jiggle_cmt');

    // ── 4. New element ──
    const newElemAction = () => this.player.setBgeNetworkStatus(); // was: r
    r3(this, this.newElemDelay, isBufferedAtTarget && !isBackgroundOrSuspended,
      isProgressingNormally, 'qoe.slowseek', newElemAction, 'new_elem');

    // ── 5. Long rebuffer detection ──
    const isVisible = isActivelyPlaying(playerState); // was: V
    const isBuffering = playerState.isBuffering(); // was: X (reassigned)
    const buffered = mediaElement.pU(); // was: B
    const bufferIndex = findRangeIndex(buffered, currentTime); // was: n
    const hasSubstantialBuffer = bufferIndex >= 0 && buffered.end(bufferIndex) > currentTime + 5; // was: S
    const longRebufferCondition = isVisible && isBuffering && hasSubstantialBuffer; // was: U (reassigned)

    const videoData = this.player.getVideoData(); // was: I (reassigned)

    // Shorts slow-seek new-element
    r3(this, this.shortsNewElemDelay,
      currentTime < 0.002 && this.seekTarget < 0.002 && isSeeking && isTvHtml5(this.config) && isShortsPage(videoData) && !isBackgroundOrSuspended,
      isProgressingNormally, 'qoe.slowseek', newElemAction, 'slow_seek_shorts');

    // Gapless slow-seek
    r3(this, this.gaplessSlowSeek,
      videoData.cI() && isSeeking && !isBackgroundOrSuspended && !videoData.L,
      isProgressingNormally, 'qoe.slowseek', newElemAction, 'slow_seek_gapless_shorts');

    // Long-rebuffer jiggle
    r3(this, this.longRebufferJiggleDelay,
      longRebufferCondition && !isBackgroundOrSuspended,
      isVisible && !isBuffering, 'qoe.longrebuffer', jiggleAction, 'jiggle_cmt');

    // Long-rebuffer new element (non-network-related)
    r3(this, this.longRebufferNewElem,
      longRebufferCondition && !isBackgroundOrSuspended,
      isVisible && !isBuffering, 'qoe.longrebuffer', newElemAction, 'new_elem_nnr');

    // ── 6. Unreported seek re-seek ──
    if (loader) {
      const loaderTime = loader.getCurrentTime(); // was: w
      let mappedTime = mediaElement.K(); // was: K (reassigned)
      mappedTime = getRangeStart(mappedTime, loaderTime);
      const isStuck = !loader.isSeeking() && currentTime === mappedTime;
      r3(this, this.unreportedReseekDelay,
        isVisible && isBuffering && isStuck && !isBackgroundOrSuspended,
        isVisible && !isBuffering && !isStuck, 'qoe.longrebuffer', () => {
          mediaElement.seekTo(loaderTime);
        }, 'seek_to_loader');
    }

    // ── 7. Long-rebuffer timeout reporting ──
    const diagInfo = {}; // was: K (reassigned)
    const discontIndex = findRangeIndex(buffered, Math.max(currentTime - 3.5, 0)); // was: e
    const closeToEdge = discontIndex >= 0 && currentTime > buffered.end(discontIndex) - 1.1; // was: d
    const gapSize = discontIndex >= 0 && discontIndex + 1 < buffered.length
      ? buffered.start(discontIndex + 1) - buffered.end(discontIndex)
      : 9999; // was: b

    diagInfo.mindex = bufferIndex;
    diagInfo.disIndex = discontIndex;
    diagInfo.isdisc = discontIndex >= 0 && closeToEdge && gapSize < 11;
    diagInfo.close2edge = closeToEdge;
    diagInfo.gapsize = gapSize;
    diagInfo.buflen = buffered.length;
    if (this.seekSource) diagInfo.seekSour = this.seekSource;

    r3(this, this.longRebufferThreshold,
      isVisible && isBuffering && !isBackgroundOrSuspended,
      isVisible && !isBuffering, 'qoe.longrebuffer', () => {}, 'timeout', diagInfo);

    // ── 8. Ads preroll lock ──
    const prerollLocked = this.player.iterateCursor() && !playerState.isSuspended(); // was: K
    r3(this, this.adsPrerollTimeout,
      prerollLocked, !prerollLocked, 'qoe.start15s', () => {
        this.player.checkAdExperiment('ad');
      }, 'ads_preroll_timeout');

    // ── 9. Slow ad detection ──
    const rateScale = this.config.experiments.SG('html5_use_playback_rate_in_skip_slow_ad')
      ? this.player.getPlaybackRate() * 1000 : 1000; // was: K
    const recentProgress = currentTime - this.lastPlaybackTime < rateScale / 1000 / 2; // was: n
    const isAdPlaying = videoData.isAd(); // was: e
    const slowAdCondition = isAdPlaying && isVisible && !isBuffering && recentProgress; // was: d

    const skipSlowAdAction = () => { // was: K
      const player = this.player; // was: w
      const nextVideoData = player.sO.getVideoData(); // was: f
      if ((!nextVideoData || !player.videoData.isAd() || nextVideoData.PJ !== player.getVideoData().PJ)
        && player.videoData.wX
      ) {
        // no-op if video changed
      } else {
        player.o$('ad.rebuftimeout', 2, 'RETRYABLE_ERROR', `skipslad.vid.${player.videoData.videoId}`);
      }
    };

    r3(this, this.slowAdReporter, slowAdCondition, !slowAdCondition,
      'ad.rebuftimeout', skipSlowAdAction, 'skip_slow_ad');

    const slowAdBufCondition = isAdPlaying && isBuffering && isTimeInRange(mediaElement.pU(), currentTime + 5) && recentProgress;
    r3(this, this.slowAdBuffering,
      slowAdBufCondition && !isBackgroundOrSuspended, !slowAdBufCondition,
      'ad.rebuftimeout', skipSlowAdAction, 'skip_slow_ad_buf');

    // ── 10. Slow start ──
    const slowStartCondition = playerState.isOrWillBePlaying() && playerState.W(64) && !isBackgroundOrSuspended;
    r3(this, this.slowStartTimeout, slowStartCondition, isProgressingNormally,
      'qoe.start15s', () => {}, 'timeout');

    const noMseCondition = !!loader && !loader.loadVideoFromData && playerState.isOrWillBePlaying();
    r3(this, this.slowStartNoMse, noMseCondition, isProgressingNormally,
      'qoe.start15s', newElemAction, 'newElemMse');

    // ── 11. Shorts media source / element reuse ──
    const bufferAtZero = getRemainingInRange(buffered, 0); // was: A
    const seekingOrLoading = playerState.W(16) || playerState.W(32); // was: B
    const reuseCondition = !isBackgroundOrSuspended
      && playerState.isOrWillBePlaying()
      && isBuffering
      && !seekingOrLoading
      && (playerState.W(64) || currentTime === 0)
      && bufferAtZero > 5; // was: A

    r3(this, this.shortsMediaSourceReuse, reuseCondition,
      isVisible && !isBuffering, 'qoe.longrebuffer', () => {
        this.player.LatencyTimer();
      }, 'reset_media_source');

    r3(this, this.shortsMediaElementReuse, reuseCondition,
      isVisible && !isBuffering, 'qoe.longrebuffer', newElemAction, 'reset_media_element');

    // ── 12. Re-seek after time jump ──
    if (this.lastPlaybackTime === 0) {
      this.noProgressStartTime = currentTime; // was: this.D = W
    }
    const timeJumpCondition = isBuffering && this.seekTarget === 0 && currentTime > 1 && currentTime === this.noProgressStartTime;
    r3(this, this.reseekAfterTimeJump,
      isShortsPage(videoData) && timeJumpCondition,
      isVisible && !isBuffering, 'qoe.slowseek', () => {
        mediaElement.seekTo(0);
      }, 'reseek_after_time_jump');

    // ── 13. Gapless handoff long rebuffer ──
    const isPlaying = playerState.isOrWillBePlaying() && !isBackgroundOrSuspended; // was: T (reassigned)
    const nearEnd = this.player.qE() - currentTime < 6 && !hasSubstantialBuffer && this.player.bS(); // was: S
    r3(this, this.gaplessHandoffLongRebuf,
      videoData.cI() && isPlaying && isBuffering && nearEnd,
      isVisible && !isBuffering, 'qoe.longrebuffer', () => {
        this.player.setBgeNetworkStatus(false, true);
      }, 'handoff_end_long_buffer_reload');

    // ── 14. Gapless ad slow start ──
    const isGaplessTransition = this.seekSource === 104 || this.player.disableSsdai; // was: T
    const gaplessAdCondition = isGaplessShortEligible(videoData) && videoData.isAd() && !videoData.L
      && isGaplessTransition
      && (isBuffering || (playerState.W(8) && playerState.W(16))); // was: c
    r3(this, this.shortsGaplessAdSlowStart, gaplessAdCondition,
      isProgressingNormally, 'qoe.start15s', newElemAction, 'gapless_ad_slow_start');

    // ── 15. Gapless slow start ──
    const gaplessSlowCondition = isGaplessShortEligible(videoData) && !videoData.L && isGaplessTransition && longRebufferCondition;
    r3(this, this.shortsGaplessSlowStart, gaplessSlowCondition,
      isProgressingNormally, 'qoe.longrebuffer', newElemAction, 'gapless_slow_start');

    // Update last-observed time, restart poll
    this.lastPlaybackTime = currentTime; // was: this.j = W
    this.pollTimer?.start(); // was: this.K.start()
  }

  /**
   * Report a watchdog event to the player's QoE system.
   * [was: I$]
   *
   * @param {string} eventName [was: Q]
   * @param {TimeoutEntry} entry [was: c]
   * @param {string} detail [was: W]
   */
  reportEvent(eventName, entry, detail) { // was: I$
    const payload = this.buildPayload(entry); // was: c (reassigned)
    payload.appendErrorArgs = detail;
    payload.wdup = this.reportedEvents[eventName] ? '1' : '0';
    this.player.I$(new PlayerError(eventName, payload));
    this.reportedEvents[eventName] = true; // was: this.A[Q] = !0
  }

  /**
   * Build the analytics payload, merging player metrics with timeout state.
   * [was: wA]
   *
   * @param {TimeoutEntry} entry [was: Q]
   * @returns {Object}
   */
  buildPayload(entry) { // was: wA
    const payload = Object.assign(this.player.isGaplessShortEligible(true), entry.isGaplessShortEligible()); // was: Q
    if (this.seekTarget) {
      payload.stt = this.seekTarget.toFixed(3);
    }
    if (this.player.getVideoData().isLivePlayback) {
      payload.ct = this.player.getCurrentTime().toFixed(3);
      payload.to = this.player.getStreamTimeOffsetNQ.toFixed(3);
    }
    // Strip PII / large fields
    delete payload.uga;
    delete payload.euri;
    delete payload.referrer;
    delete payload.fexp;
    delete payload.getInMemoryStore;
    return payload;
  }
}

// ---------------------------------------------------------------------------
// TimeoutEntry — individual timeout watchdog
// ---------------------------------------------------------------------------

/**
 * A single timeout watchdog: tracks elapsed poll ticks and fires when the
 * configured threshold (in seconds, rounded up from ms) is exceeded.
 *
 * [was: TX]  (line 97670)
 *
 * @param {number} thresholdMs [was: Q] — timeout in milliseconds
 * @param {boolean} [suppressAction=false] [was: c] — if true, report but don't act
 */
export class TimeoutEntry { // was: TX
  constructor(thresholdMs, suppressAction = false) { // was: Q, c=!1
    this.suppressAction = suppressAction; // was: this.D
    this.startTimestamp = 0; // was: this.startTimestamp
    this.elapsedTicks = 0; // was: this.A — number of poll ticks elapsed
    this.triggeredTimestamp = 0; // was: this.O — wall-clock time when triggered
    this.activeStartTimestamp = 0; // was: this.W — when the condition first became true
    this.hasTriggered = false; // was: this.j = !1
    this.thresholdTicks = Math.ceil(thresholdMs / 1000); // was: this.K
  }

  /**
   * Reset all state.
   * [was: reset]
   */
  reset() {
    this.startTimestamp = 0;
    this.elapsedTicks = 0;
    this.triggeredTimestamp = 0;
    this.activeStartTimestamp = 0;
    this.hasTriggered = false;
  }

  /**
   * Test whether the timeout has elapsed. Called once per poll tick.
   * Returns true exactly once when threshold is reached.
   * [was: test]
   *
   * @param {boolean} conditionMet [was: Q] — is the triggering condition active?
   * @returns {boolean} True if this tick crosses the threshold
   */
  test(conditionMet) { // was: test
    if (!this.thresholdTicks || this.triggeredTimestamp) return false;
    if (!conditionMet) {
      this.reset();
      return false;
    }
    const now = (0, g.h)(); // was: Q (reassigned)
    if (!this.startTimestamp) {
      this.startTimestamp = now;
      this.elapsedTicks = 0;
    } else if (this.elapsedTicks >= this.thresholdTicks) {
      this.triggeredTimestamp = now;
      return true;
    }
    this.elapsedTicks += 1;
    return false;
  }

  /**
   * Build analytics sub-payload with watchdog timing data.
   * [was: wA]
   *
   * @returns {Object}
   */
  isGaplessShortEligible() { // was: wA
    const payload = {}; // was: Q
    const now = (0, g.h)(); // was: c
    if (this.startTimestamp) {
      payload.wsd = (now - this.startTimestamp).toFixed(); // watchdog start delta
    }
    if (this.triggeredTimestamp) {
      payload.wtd = (now - this.triggeredTimestamp).toFixed(); // watchdog triggered delta
    }
    if (this.activeStartTimestamp) {
      payload.wssd = (now - this.activeStartTimestamp).toFixed(); // watchdog active-start delta
    }
    return payload;
  }
}
