/**
 * Segment writer — MSE SourceBuffer segment appender, segment fetcher,
 * rolling buffer statistics, and metric sampling.
 *
 * Extracted from base.js lines 97709–98052.
 *
 * @module segment-writer
 */

import { Disposable } from '../core/disposable.js';
import { resolvedPromise } from '../core/composition-helpers.js'; // was: g.QU
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { handleGaplessSeek } from './live-playback.js'; // was: Iq
import { clearSeekState } from './buffer-manager.js'; // was: Vk
import { isVideoPlayerSeekDisabled } from './live-playback.js'; // was: A5
import { getPersistedQuality } from '../ads/ad-async.js'; // was: XU
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { initiateSeek } from './buffer-manager.js'; // was: qG
import { resetBufferPosition } from '../modules/caption/caption-internals.js'; // was: Er
import { clampToSeekableRange } from './buffer-manager.js'; // was: Ub
import { installPolyfill } from '../core/polyfills.js'; // was: UO
import { removeEndCreditsCueRange } from './live-playback.js'; // was: Zy
import { clearStateBits } from './source-buffer.js'; // was: Vv
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { computeTimeSinceCreation } from './audio-normalization.js'; // was: BhK
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { isCobaltAppleTV } from '../core/composition-helpers.js'; // was: y5
import { getBufferedEnd } from './source-buffer.js'; // was: KA
import { getCurrentTimeSec } from '../player/playback-bridge.js'; // was: Qd
import { getSeekableRangeStart } from '../player/time-tracking.js'; // was: bC()
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { createDatabaseDefinition } from '../data/idb-transactions.js'; // was: el
import { hasBufferedData } from './codec-helpers.js'; // was: Jm
import { getLoadFraction } from '../player/time-tracking.js'; // was: TV()
import { seekTo, dispose } from '../ads/dai-cue-range.js';
import { getCurrentTime, getSeekableStart, isAtLiveHead, getStreamTimeOffset, getWallClockTime, getDuration } from '../player/time-tracking.js';
import { setTimestampOffset } from './media-source.js';
import { clear } from '../core/array-utils.js';
import { RingBuffer } from './seek-state-machine.js';
// TODO: resolve g.pl

// ---------------------------------------------------------------------------
// SourceBufferWriter — MSE segment append orchestrator
// ---------------------------------------------------------------------------

/**
 * Manages writing media segments to an MSE SourceBuffer. Handles seek
 * timelines, timestamp offsets, live-stream time sync, buffering watchdogs,
 * and error recovery when appends fail.
 *
 * [was: Fao]  (line 97709)
 * Extends Disposable [was: g.qK].
 *
 * Key properties:
 *   player              [was: EH]    — owning player reference
 *   playbackData        [was: playbackData] — null until loaded
 *   mediaElement        [was: mediaElement]  — HTMLMediaElement wrapper
 *   loader              [was: loader]       — segment loader reference
 *   liveCoordinator     [was: W]            — TimeSyncCoordinator for live
 *   timestampOffset     [was: timestampOffset] — media→presentation offset (seconds)
 *   config              [was: FI]           — player config/experiments
 *   videoData           [was: videoData]    — video metadata
 *   policy              [was: policy]       — Sv9 instance (empty policy bag)
 *   timeoutManager      [was: mF]           — yHZ (TimeoutManager) for seek watchdogs
 *   currentTime         [was: O]            — last-known current time
 *   centralTime         [was: D]            — centralized player time
 *   seekPromise         [was: K]            — pending seek promise (g8)
 *   seekTarget          [was: A]            — stored seek position
 *   pendingSeekTimestamp [was: Re]           — NaN until seek in progress
 *   isSeeking           [was: Ie]           — whether a seek is active
 *   codecSwitchPending  [was: S]            — codec change queued
 *   appendable          [was: Y]            — ready to accept appends
 *   appendFailures      [was: UH]           — consecutive append-failure count
 *   initReceived        [was: iX]           — init segment processed
 *   headerAppended      [was: HA]           — MSE header appended
 *   seekCount           [was: J]            — seek iteration counter
 *   gaplessHandoff      [was: La]           — in gapless-handoff mode
 *   gapThreshold        [was: T2]           — gap detection threshold (seconds)
 *   resetThreshold      [was: jG]           — reset-on-seek threshold (seconds)
 *
 * Timers:
 *   appendRetryTimer    [was: MM]  — 2 s retry after sI_ (flush re-append)
 *   syncTimer           [was: WB]  — deferred Iq (sync state)
 *   seekDelayTimer      [was: XI]  — deferred bl3 (start seek)
 *   usageTimer          [was: Y0]  — 10 s usage-accounting tick
 *
 * @param {Object} player [was: Q / this.EH]
 */
export class SourceBufferWriter extends Disposable { // was: Fao
  constructor(player) { // was: Q
    super();
    this.player = player; // was: this.EH
    this.liveCoordinator = null; // was: this.W
    this.loader = null; // was: this.loader
    this.mediaElement = null; // was: this.mediaElement
    this.playbackData = null; // was: this.playbackData
    this.pendingData = null; // was: this.L
    this.seekTarget = 0; // was: this.A
    this.seekPromise = null; // was: this.K
    this.previousSeekPromise = null; // was: this.b0
    this.liveTimeSync = null; // was: this.j
    this.isSeeking = false; // was: this.Ie = !1
    this.appendFailures = 0; // was: this.Fw = 0
    this.codecSwitchPending = false; // was: this.S = !1
    this.timestampOffset = 0; // was: this.timestampOffset = 0
    this.appendable = true; // was: this.Y = !0
    this.seekOffsetCount = 0; // was: this.UH = 0
    this.initReceived = false; // was: this.iX = !1
    this.headerAppended = false; // was: this.HA = !1
    this.seekCount = 0; // was: this.J = 0
    this.gaplessHandoff = false; // was: this.La = !1
    this.gapThreshold = 0; // was: this.T2 = 0
    this.resetThreshold = 0; // was: this.jG = 0

    this.config = this.player.G(); // was: this.FI = this.EH.G()
    this.videoData = this.player.getVideoData(); // was: this.videoData = this.EH.getVideoData()
    this.policy = new SourceBufferPolicy(); // was: this.policy = new Sv9

    this.timeoutManager = null; // was: this.mF = new yHZ(this.EH)
    // In original: this.mF = new yHZ(this.EH) — creates a TimeoutManager

    this.currentTime = NaN; // was: this.O
    this.centralTime = NaN; // was: this.D
    this.pendingSeekTimestamp = NaN; // was: this.Ka
    this.seekRestoreTime = NaN; // was: this.Re
    this.lastSyncEpoch = NaN; // was: this.PA
    this.utcSeekTarget = NaN; // was: this.EC

    // ── Timers ──
    this.appendRetryTimer = null; // was: this.MM = new g.Uc(() => sI_(this, false), 2000)
    this.syncTimer = null; // was: this.WB = new g.Uc(() => Iq(this))
    this.seekDelayTimer = null; // was: this.XI = new g.Uc(() => bl3(this, {}))
    this.usageTimer = null; // was: this.Y0 — 10 s usage accounting

    // In original, timers are registered for cascading disposal:
    // g.F(this, this.timeoutManager);
    // g.F(this, this.appendRetryTimer);
    // g.F(this, this.seekDelayTimer);
    // g.F(this, this.syncTimer);
    // g.F(this, this.usageTimer);
  }

  /**
   * Attach or detach the media element. Triggers seek-timeline setup
   * when an element is provided, or full teardown when null.
   * [was: setMediaElement]
   *
   * @param {Object|null} element [was: Q] — media element wrapper
   */
  setMediaElement(element) { // was: setMediaElement
    this.mediaElement = element; // was: (this.mediaElement = Q)
    if (this.mediaElement) {
      // If no pending seek and element ready, trigger setup seek
      if (!this.seekPromise && !this.seekTarget && this.mediaElement.readRepeatedMessageField()) {
        // no-op
      } else if (!this.seekPromise && !this.seekTarget && !this.mediaElement.readRepeatedMessageField()) {
        this.seekTo(0.01, { Z7: 'seektimeline_setupMediaElement' });
      }
      handleGaplessSeek(this); // was: Iq(this) — sync state
    } else {
      clearSeekState(this); // was: Vk(this) — teardown
    }
  }

  /**
   * Return the current playback time, preferring centralized or cached
   * values when experiment flags are active.
   * [was: getCurrentTime]
   *
   * @param {boolean} [raw=false] [was: Q] — bypass centralized time
   * @returns {number} Seconds
   */
  getCurrentTime(raw = false) { // was: getCurrentTime
    if (isVideoPlayerSeekDisabled(this.player)) { // was: A5(this.EH)
      if (this.config.X('html5_use_centralized_player_time') && !raw && !isNaN(this.centralTime)) {
        return this.centralTime; // was: this.D
      }
      if (!isNaN(this.currentTime)) return this.currentTime; // was: this.O
    } else {
      if (this.config.X('html5_use_centralized_player_time') && !raw && !isNaN(this.centralTime) && isFinite(this.centralTime)) {
        return this.centralTime;
      }
      const useCentralized = this.config.X('html5_use_centralized_player_time'); // was: Q (reassigned)
      if (!isNaN(this.currentTime) && (useCentralized || isFinite(this.currentTime))) {
        return this.currentTime;
      }
    }
    return this.mediaElement && dRn(this)
      ? this.mediaElement.getCurrentTime() + this.timestampOffset
      : this.seekTarget || 0;
  }

  /**
   * Return the UTC seek target (if any).
   * [was: Np]
   *
   * @returns {number|undefined}
   */
  getUtcSeekTarget() { // was: Np
    return this.JJ; // was: this.JJ
  }

  /**
   * Time elapsed since the start of the live window.
   * [was: TH]
   *
   * @returns {number}
   */
  getTimeSinceLiveStart() { // was: TH
    return this.getCurrentTime() - this.getTimestampOffset();
  }

  /**
   * Start of the seekable range for live streams.
   * [was: sR]
   *
   * @returns {number}
   */
  getSeekableStart() { // was: sR
    return this.liveCoordinator
      ? this.liveCoordinator.getSeekableStart() // was: this.W.sR()
      : Infinity;
  }

  /**
   * Whether playback is at the live head.
   * [was: isAtLiveHead]
   *
   * @param {number} [time] [was: Q]
   * @returns {boolean}
   */
  isAtLiveHead(time) { // was: isAtLiveHead
    if (!this.liveCoordinator) return false;
    if (time === undefined) time = this.getCurrentTime();
    return Kf(this.liveCoordinator, time); // was: Kf(this.W, Q)
  }

  /**
   * Whether the live coordinator supports server-time sync.
   * [was: kU]
   *
   * @returns {boolean}
   */
  canSyncFromServer() { // was: kU
    return !!this.liveCoordinator && this.liveCoordinator.canSync();
  }

  /**
   * Initiate a seek to the given time. Validates the target against the
   * seekable window, applies timestamp offsets, and coordinates with the
   * loader and player state machine.
   *
   * [was: seekTo]  (line 97797)
   *
   * @param {number} targetTime [was: Q]
   * @param {Object} [options] — destructured seek options
   * @param {boolean} [options.b_=false] [was: b_] — delayed seek
   * @param {number} [options.GM=0] [was: GM] — delay ms for deferred seek
   * @param {boolean} [options.Qo=false] [was: Qo] — force-allow out-of-window
   * @param {number} [options.XU=0] [was: XU] — seek offset kind
   * @param {string} [options.Z7=''] [was: Z7] — reason tag for logging
   * @param {number} [options.seekSource] [was: seekSource]
   * @param {boolean} [options.h7=false] [was: h7] — relative to timestamp offset
   * @param {boolean} [options.Ui=false] [was: Ui] — SABR-initiated seek
   * @param {boolean} [options.EZ=false] [was: EZ] — skip window clamping
   * @returns {Promise|undefined} Seek promise or undefined if rejected
   */
  seekTo(targetTime, {
    b_: delayed = false,
    GM: delayMs = 0,
    Qo: forceAllow = false,
    getPersistedQuality: seekOffsetKind = 0,
    Z7: reason = '',
    seekSource,
    h7: relativeToOffset = false,
    Ui: sabrInitiated = false,
    EZ: skipClamping = false,
  } = {}) { // was: seekTo(Q, {b_: c=!1, GM: W=0, ...})
    if (relativeToOffset) targetTime += this.getTimestampOffset(); // was: U && (Q += this.NQ())

    // Clear UTC seek target on source-29 SABR seeks
    if (shouldUseSabr(this.videoData) && seekSource === 29) this.JJ = undefined; // was: void 0

    // Detect and handle seeks before last-adjusted timestamp
    const seekBeforeAdjust = targetTime < this.pendingSeekTimestamp && !!this.loader; // was: U
    const isSabrForceAllow = shouldUseSabr(this.videoData) && sabrInitiated; // was: A

    if (seekBeforeAdjust && !isSabrForceAllow) {
      this.player.RetryTimer('sdai', {
        sk2bk: targetTime.toFixed(3),
        mt: (targetTime - this.timestampOffset).toFixed(3),
        lstadj: this.pendingSeekTimestamp.toFixed(3),
      });
      this.pendingSeekTimestamp = NaN;
      this.timestampOffset -= 1000;
      this.loader?.tQ();
    }

    // ── Validate seek target against seekable window ──
    let allowed = targetTime; // was: A (reassigned)
    const isManifestFetched = shouldUseSabr(this.videoData); // was: V
    if (isManifestFetched && sabrInitiated) {
      allowed = true;
    } else {
      const alwaysAllowSqless = this.config.X('html5_always_allow_sqless_sync') && this.videoData.positionMarkerOverlays();
      if ((isManifestFetched || alwaysAllowSqless) && reason === 'chunkSelectorSynchronize') {
        allowed = true;
      } else {
        const inWindow = !isFinite(allowed)
          || (this.liveCoordinator ? Kf(this.liveCoordinator, allowed) : allowed >= this.getEndTime())
          || !g.pl(this.videoData); // was: e
        if (!inWindow) {
          const logPayload = { st: allowed, mst: this.getEndTime() };
          if (this.liveCoordinator && this.config.X('html5_high_res_seek_logging')) {
            logPayload.ht = this.liveCoordinator.getSeekableStart();
            logPayload.adft = m6(this.liveCoordinator);
          }
          this.player.RetryTimer('seeknotallowed', logPayload);
        }
        allowed = inWindow;
      }
    }

    if (!allowed) {
      if (this.seekPromise) {
        this.seekPromise = null;
        initiateSeek(this);
      }
      return resolvedPromise(this.getCurrentTime());
    }

    // ── Tolerance check — avoid redundant seeks ──
    let tolerance = 0.005; // was: A
    if (sabrInitiated && this.config.X('html5_sabr_seek_no_shift_tolerance')) {
      tolerance = 0;
    }
    if (Math.abs(targetTime - this.currentTime) <= tolerance && this.isSeeking) {
      return this.seekPromise;
    }

    // Reset rate limiter / backoff on user seek
    if (this.config.X('html5_reset_rate_limiter_on_user_seek')) this.loader?.rX();
    if (this.config.X('html5_reset_backoff_on_user_seek')) this.loader?.resetBufferPosition();

    // Log seek reason
    if (reason) {
      if (this.config.cB()) {
        const logData = { reason, tgt: targetTime };
        if (this.config.X('html5_sabr_csdai_seek_log')) logData.source = seekSource;
        this.player.RetryTimer('seekreason', logData);
      }
    }

    if (seekSource) this.timeoutManager.seekSource = seekSource; // was: this.mF.O = r

    // Tear down previous seek state
    if (this.isSeeking) clearSeekState(this);
    if (!this.seekPromise) this.seekPromise = new g8(); // was: new g8

    // Handle Infinity seeks (live edge)
    if (targetTime && !isFinite(targetTime)) eV(this, false);

    const shouldSkipClamping = skipClamping || seekBeforeAdjust; // was: X
    if (!shouldSkipClamping) targetTime = clampToSeekableRange(this, targetTime, forceAllow);
    if (targetTime && !isFinite(targetTime)) eV(this, false);

    // Update internal state
    if (this.config.X('html5_use_centralized_player_time')) {
      this.centralTime = targetTime; // was: this.D = Q
    } else {
      this.currentTime = this.seekTarget = targetTime; // was: this.O = this.A = Q
    }
    this.seekOffsetCount = seekOffsetKind; // was: this.UH = K
    this.seekCount = 0; // was: this.J = 0

    // Sync live coordinator
    if (this.liveCoordinator) Zly(this.liveCoordinator, targetTime, false);

    // Notify player
    const p = this.player; // was: m
    p.installPolyfill.A = targetTime; // was: m.UO.A = K
    const tracker = p.hY; // was: T
    tracker.mediaTime = targetTime;
    tracker.isSeeking = true; // was: T.W = !0
    if (delayed) p.Ts({ b_: delayed, seekSource });
    if (targetTime > p.videoData.endSeconds && targetTime > p.videoData.limitedPlaybackDurationInSeconds) {
      if (p.Zs && isFinite(targetTime)) removeEndCreditsCueRange(p);
    }
    if (targetTime < p.TU() - 0.01) {
      let nextState = clearStateBits(p.playerState, 2); // was: X
      if (nextState.W(8)) nextState = clearStateBits(nextState, 4);
      p.OO(nextState);
    }
    p.publish('SEEK_TO', targetTime);

    // Reset threshold guard
    if (this.resetThreshold > 0 && targetTime < this.resetThreshold) {
      this.resetThreshold = 0;
      this.player.setBgeNetworkStatus();
    }

    // Execute or defer the actual seek
    if (this.seekPromise) {
      if (delayed) {
        if (delayMs) this.seekDelayTimer?.start(delayMs);
      } else {
        bl3(this, { Ui: sabrInitiated, seekSource });
      }
    }

    // End-of-stream boundary check
    const endBoundary = this.player.Zs; // was: c
    if (endBoundary && targetTime > endBoundary.start) removeEndCreditsCueRange(this.player);

    return this.seekPromise;
  }

  /**
   * Compute the end-of-stream / live-head time.
   * [was: TU]
   *
   * @param {boolean} [useStart] [was: Q]
   * @returns {number}
   */
  getEndTime(useStart) { // was: TU
    if (!this.videoData.isLivePlayback) return this.player.videoData.TU();

    if (this.videoData.Ie() && this.mediaElement?.isPaused() && this.videoData.W) {
      const ct = this.getCurrentTime(); // was: Q
      return computeTimeSinceCreation(this.Kk(ct) * 1000) + ct;
    }
    if (this.config.X('html5_sabr_parse_live_metadata_playback_boundaries') && shouldUseSabr(this.videoData) && this.videoData.W) {
      return useStart ? (this.videoData.W.isSamsungSmartTV || 0) : (this.videoData.W.Jk || 0);
    }
    if (G3(this.videoData) && this.videoData.Gd && this.videoData.W) {
      return this.videoData.W.TU() + this.timestampOffset;
    }
    if (this.videoData.A?.W()) {
      return !useStart && this.liveCoordinator
        ? this.liveCoordinator.getSeekableStart()
        : this.player.videoData.TU() + this.timestampOffset;
    }
    if (!this.mediaElement) return this.timestampOffset;
    return isCobaltAppleTV()
      ? computeTimeSinceCreation(this.mediaElement.jG().getTime())
      : (getBufferedEnd(this.mediaElement) + this.timestampOffset) || this.timestampOffset;
  }

  /**
   * Start of the DVR window (earliest seekable point).
   * [was: bC]
   *
   * @returns {number}
   */
  getWindowStart() { // was: bC
    if (this.config.X('html5_sabr_parse_live_metadata_playback_boundaries') && shouldUseSabr(this.videoData)) {
      return this.videoData.W?.getCurrentTimeSec || 0;
    }
    const base = this.videoData ? this.videoData.getSeekableRangeStart + this.timestampOffset : this.timestampOffset;
    if (this.videoData.Ie() && this.videoData.W) {
      let utcStart = Number(this.videoData.progressBarStartPosition?.utcTimeMillis) / 1000; // was: c
      if (!isNaN(utcStart)) {
        utcStart = this.estimateStreamTime(utcStart); // was: this.bj(c)
        if (!isNaN(utcStart)) return Math.max(base, utcStart);
      }
    }
    return base;
  }

  /**
   * Force-resume from stored seek target (e.g. after MSE transition).
   * [was: QW]
   */
  forceResume() { // was: QW
    if (!this.seekPromise) {
      this.seekTo(this.seekTarget, {
        Z7: 'seektimeline_forceResumeTime_singleMediaSourceTransition',
        seekSource: 15,
      });
    }
  }

  /**
   * Whether a seek to an infinite target is in progress.
   * [was: Ba]
   *
   * @returns {boolean}
   */
  isSeekingToLiveEdge() { // was: Ba
    return this.isSeeking && !isFinite(this.currentTime);
  }

  /**
   * Dispose internal resources.
   * [was: WA]
   */
  disposeInternal() { // was: WA
    Bf(this, null); // was: Bf(this, null)
    this.timeoutManager?.dispose(); // was: this.mF.dispose()
    super.disposeInternal();
  }

  /**
   * Return analytics payload from loader + media element.
   * [was: wA]
   *
   * @returns {Object}
   */
  getAnalytics() { // was: wA
    const result = {}; // was: Q
    if (this.loader) Object.assign(result, this.loader.isGaplessShortEligible());
    if (this.mediaElement) Object.assign(result, this.mediaElement.isGaplessShortEligible());
    return result;
  }

  /**
   * Set the timestamp offset (media → presentation time mapping).
   * [was: jR]
   *
   * @param {number} offset [was: Q]
   */
  setTimestampOffset(offset) { // was: jR
    this.timestampOffset = offset;
  }

  /**
   * Get the stream-time offset (0 for G3-type streams, else from live manifest).
   * [was: getStreamTimeOffset]
   *
   * @returns {number}
   */
  getStreamTimeOffset() { // was: getStreamTimeOffset
    if (G3(this.videoData)) return 0;
    return this.videoData.W ? this.videoData.W.getStreamTimeOffset() : 0;
  }

  /**
   * Return the current timestamp offset.
   * [was: NQ]
   *
   * @returns {number}
   */
  getTimestampOffset() { // was: NQ
    return this.timestampOffset;
  }

  /**
   * Map a presentation time to a wall-clock time via the live manifest.
   * [was: Kk]
   *
   * @param {number} presentationTime [was: Q]
   * @returns {number}
   */
  getWallClockTime(presentationTime) { // was: Kk
    if (this.videoData?.W) {
      return this.videoData.W.Kk(presentationTime - this.timestampOffset);
    }
    return NaN;
  }

  /**
   * Fraction of video buffered (0..1). For live, relative to the DVR window.
   * [was: TV]
   *
   * @returns {number}
   */
  getBufferedFraction() { // was: TV
    if (!this.mediaElement) return 0;
    if (QS(this.videoData)) {
      const createDatabaseDefinition = this.mediaElement; // was: Q
      const buffered = createDatabaseDefinition.pU(); // was: c
      const bufferedEnd = (hasBufferedData(buffered) && createDatabaseDefinition.getDuration() ? buffered.end(buffered.length - 1) : 0)
        + this.timestampOffset - this.getWindowStart(); // was: Q
      const windowSize = this.getEndTime() - this.getWindowStart(); // was: c
      return Math.max(0, Math.min(1, bufferedEnd / windowSize));
    }
    return this.mediaElement.getLoadFraction;
  }

  /**
   * Update liveCoordinator's secondary parameter.
   * [was: RE]
   *
   * @param {*} value [was: Q]
   */
  updateLiveParam(value) { // was: RE
    if (this.liveCoordinator) this.liveCoordinator.W = value; // was: this.L.W = Q
  }

  /**
   * Initiate a UTC-based seek for live streams.
   * [was: H7]
   *
   * @param {number} utcTime [was: Q]
   * @param {number} [fallbackStreamTime] [was: c]
   * @param {*} [extra] [was: W]
   */
  seekToUtc(utcTime, fallbackStreamTime, extra) { // was: H7
    this.player.RetryTimer('requestUtcSeek', { time: utcTime });
    if (shouldUseSabr(this.videoData)) this.JJ = utcTime;
    this.loader?.H7(utcTime, extra);
    if (fallbackStreamTime) this.gapThreshold = fallbackStreamTime; // was: this.T2 = c
  }

  /**
   * Handle a UTC seek fallback when the primary seek path fails.
   * [was: CI]
   *
   * @param {number} utcTimeMs [was: Q]
   */
  handleUtcSeekFallback(utcTimeMs) { // was: CI
    if (shouldUseSabr(this.videoData)) this.JJ = undefined;
    if (this.gapThreshold) {
      this.player.RetryTimer('utcSeekingFallback', { source: 'streamTime', timeSeconds: this.gapThreshold });
      this.player.seekTo(this.gapThreshold, { Z7: 'utcSeekingFallback_streamTime' });
      this.gapThreshold = 0;
    } else {
      const estimated = this.estimateStreamTime(utcTimeMs); // was: Q (reassigned)
      if (!isNaN(estimated)) {
        this.player.RetryTimer('utcSeekingFallback', { source: 'estimate', timeSeconds: estimated });
        this.player.seekTo(estimated, { Z7: 'utcSeekingFallback_estimate' });
      }
    }
  }

  /** Clear gap threshold. [was: Aw] */
  clearGapThreshold() { // was: Aw
    this.gapThreshold = 0;
  }

  /**
   * Set reset-on-seek threshold.
   * [was: RU]
   *
   * @param {number} threshold [was: Q]
   */
  setResetThreshold(threshold) { // was: RU
    this.resetThreshold = threshold; // was: this.jG = Q
  }

  /**
   * Estimate a stream time from a UTC timestamp using the live manifest.
   * [was: bj]
   *
   * @param {number} utcSeconds [was: Q]
   * @returns {number}
   */
  estimateStreamTime(utcSeconds) { // was: bj
    const ct = this.getCurrentTime(); // was: c
    if (isNaN(ct)) return NaN;
    const wallClock = this.getWallClockTime(ct); // was: W
    if (isNaN(wallClock)) return NaN;
    return utcSeconds - (wallClock - ct);
  }

  /**
   * Check an experiment flag on the config.
   * [was: X]
   *
   * @param {string} flag [was: Q]
   * @returns {boolean}
   */
  hasExperiment(flag) { // was: X
    return this.config && this.config.X(flag);
  }
}

/**
 * Empty policy bag for SourceBufferWriter. Placeholder for future policy fields.
 * [was: Sv9]  (line 97989)
 */
class SourceBufferPolicy { // was: Sv9
  // intentionally empty — fields added at runtime
}

// ---------------------------------------------------------------------------
// SegmentFetcher — periodic metric sampler driving RollingMetrics
// ---------------------------------------------------------------------------

/**
 * Periodically samples a set of metric providers and feeds their values
 * into RollingMetrics instances. Polls every 250 ms.
 *
 * [was: s0Z]  (line 97992)
 * Extends Disposable [was: g.qK].
 *
 * @param {Map<string, Function>} providers [was: Q / this.A]
 *   Map from metric name to a zero-arg function returning the current value.
 */
export class SegmentFetcher extends Disposable { // was: s0Z
  constructor(providers) { // was: Q
    super();
    this.providers = providers; // was: this.A
    this.metrics = new Map(); // was: this.W — Map<string, RollingMetrics>
    this.sampleTimer = null; // was: this.O = new g.Uc(this.sample, 250, this)
    // g.F(this, this.sampleTimer)
    this.start();
  }

  /**
   * Begin periodic sampling.
   * [was: start]
   */
  start() { // was: start
    this.sampleTimer?.start(); // was: this.O.start()
  }

  /**
   * Stop periodic sampling.
   * [was: stop]
   */
  stop() { // was: stop
    this.sampleTimer?.stop(); // was: this.O.stop()
  }

  /**
   * Clear all accumulated metrics.
   * [was: clear]
   */
  clear() { // was: clear
    for (const rolling of this.metrics.values()) { // was: Q
      rolling.clear();
    }
  }

  /**
   * Take one sample from every provider and feed into the corresponding
   * RollingMetrics instance. Creates new RollingMetrics lazily.
   * [was: sample]
   */
  sample() { // was: sample
    for (const [name, getter] of this.providers) { // was: [Q, c]
      const key = name; // was: W
      const value = getter(); // was: m
      if (!this.metrics.has(key)) {
        this.metrics.set(key, new RollingMetrics(DELTA_METRIC_NAMES.has(key))); // was: new Zmi(EW9.has(W))
      }
      this.metrics.get(key).update(value);
    }
    this.sampleTimer?.start(); // was: this.O.start()
  }
}

/**
 * Set of metric names that should be stored as deltas rather than absolutes.
 * [was: EW9]  (line 98021)
 *
 * @type {Set<string>}
 */
export const DELTA_METRIC_NAMES = new Set(['networkactivity']); // was: EW9

// ---------------------------------------------------------------------------
// RollingMetrics — 100-sample ring buffer for a single metric
// ---------------------------------------------------------------------------

/**
 * Maintains a rolling window of 100 samples for a single metric.
 * When `isDelta` is true, stores the *difference* between consecutive
 * values rather than the absolute value.
 *
 * [was: Zmi]  (line 98022)
 *
 * @param {boolean} isDelta [was: Q / this.O] — delta mode
 */
export class RollingMetrics { // was: Zmi
  constructor(isDelta) { // was: Q
    this.isDelta = isDelta; // was: this.O
    this.previousValue = NaN; // was: this.W
    this.buffer = new RingBuffer(100); // was: this.buffer = new NZH(100)
  }

  /**
   * Record a new sample. In delta mode, records (value - previousValue).
   * [was: update]
   *
   * @param {number} value [was: Q]
   */
  update(value) { // was: update
    if (this.isDelta) {
      this.buffer.add(value - this.previousValue || 0);
      this.previousValue = value;
    } else {
      this.buffer.add(value);
    }
  }

  /**
   * Reset the buffer and previous-value tracker.
   * [was: clear]
   */
  clear() { // was: clear
    this.buffer.clear();
    this.previousValue = 0; // was: this.W = 0
  }
}

// Note: RingBuffer (was: NZH) is defined in seek-state-machine.js and should
// be imported from there when these modules are wired together.

// ---------------------------------------------------------------------------
// MetricSampler — base class for start/reset lifecycle
// ---------------------------------------------------------------------------

/**
 * Minimal lifecycle tracker for metrics: tracks whether sampling has
 * started and/or finished.
 *
 * [was: d9m]  (line 98038)
 */
export class MetricSampler { // was: d9m
  constructor() {
    this.started = false; // was: this.started = !1
    this.finished = false; // was: this.finished = !1
  }

  /**
   * Whether sampling has been started.
   * [was: zb]
   *
   * @returns {boolean}
   */
  hasStarted() { // was: zb
    return this.started;
  }

  /**
   * Mark sampling as started.
   * [was: start]
   */
  start() { // was: start
    this.started = true;
  }

  /**
   * Reset to initial state.
   * [was: reset]
   */
  reset() { // was: reset
    this.started = false;
    this.finished = false;
  }
}
