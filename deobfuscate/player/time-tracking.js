import { isTvHtml5 } from '../data/performance-profiling.js';
import { I, P4 } from '../data/session-storage.js';
import { recordTimedStat } from '../media/engine-config.js';
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { installPolyfill } from '../core/polyfills.js'; // was: UO
import { updateLiveBufferState } from '../media/buffer-manager.js'; // was: vQW
import { shouldUseSabr } from '../media/seek-controller.js'; // was: M8
import { handleSegmentTimestamp } from '../media/track-manager.js'; // was: EM_
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { OnLayoutSelfExitRequestedTrigger } from '../ads/ad-trigger-types.js'; // was: bh
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { getStreamTimeOffsetNQ } from './time-tracking.js'; // was: NQ()
import { getTimeInBuffer } from '../media/source-buffer.js'; // was: Tm
import { clearStateBits } from '../media/source-buffer.js'; // was: Vv
import { isLooping } from './time-tracking.js'; // was: mE()
import { addStateBits } from '../media/source-buffer.js'; // was: e7
import { SlotIdFulfilledNonEmptyTrigger } from '../ads/ad-trigger-types.js'; // was: FD
import { readRepeatedMessageField } from '../proto/varint-decoder.js'; // was: iX
import { detectFrameDropDegradation } from '../media/format-retry.js'; // was: fmw
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { getThroughputWatermark } from './time-tracking.js'; // was: Tw()
import { computeBandwidthEstimate } from '../ads/ad-prebuffer.js'; // was: U6
import { getQualityZone } from './time-tracking.js'; // was: qz()
import { getNowPlayingPosition } from './time-tracking.js'; // was: Np()
import { getTimeHead } from './time-tracking.js'; // was: TH()
import { getSeekableRange } from './time-tracking.js'; // was: sR()
import { getMediaElementTime } from './time-tracking.js'; // was: A6()
import { SeekSnapshot } from '../media/seek-state-machine.js'; // was: D9v
import { populateBandwidthTelemetry } from '../ads/ad-prebuffer.js'; // was: t8K
import { loadVideoFromData } from './media-state.js'; // was: sH
import { sendFinalFlush } from '../core/event-system.js'; // was: qH
import { getBufferHealth } from '../media/segment-request.js'; // was: El
import { NoOpLogger } from '../data/logger-init.js'; // was: WG
import { onApplicationStateChange } from './player-events.js'; // was: uo
import { getEffectiveBandwidth } from '../media/quality-manager.js'; // was: Ib
import { getLiveBroadcastTime } from '../media/quality-constraints.js'; // was: bA
import { getLoadFraction } from './time-tracking.js'; // was: TV()
import { removeTimeupdateListener } from '../ads/ad-prebuffer.js'; // was: Kt
import { PluginSlotHolder } from '../data/plugin-manager.js'; // was: t_
import { getQualityLabel } from '../modules/caption/caption-translation.js'; // was: Em
import { getNFOffset } from '../ads/ad-async.js'; // was: iU
import { readUint64 } from '../media/format-setup.js'; // was: P2
import { findChapterAtPixel } from '../ui/seek-bar-tail.js'; // was: HC
import { selectNextQuality } from '../media/segment-request.js'; // was: oT
import { needsLiveRefresh } from '../ads/ad-async.js'; // was: nJ
import { AdText } from './component-events.js'; // was: Yp
import { listenOnPlayerRoot } from '../ads/ad-click-tracking.js'; // was: EP
import { isGaplessShortEligible } from '../media/seek-controller.js'; // was: wA
import { zeroPad } from '../modules/heartbeat/health-monitor.js'; // was: S2
import { getExperimentFlags } from './time-tracking.js'; // was: Ty()
import { getAverageSegmentDuration } from '../ads/ad-async.js'; // was: yP
import { getPersistedQuality } from '../ads/ad-async.js'; // was: XU
import { SLOT_ARRAY_STATE } from '../proto/messages-core.js'; // was: Xm
import { iterateCursor } from '../data/idb-transactions.js'; // was: zE
import { getSeekableRangeStart } from './time-tracking.js'; // was: bC()
import { removeRootClass } from './playback-bridge.js'; // was: YS
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { actionCompanionAdRenderer } from '../core/misc-helpers.js'; // was: zm
import { isLoaderAvailable } from './time-tracking.js'; // was: A_()
import { supportsDashOpus } from '../media/codec-detection.js'; // was: FG
import { globalEventBuffer } from '../data/module-init.js'; // was: rM
import { bezierY } from '../core/bitstream-helpers.js'; // was: Oc
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { callAw } from './time-tracking.js'; // was: Aw()
import { truncateValue } from '../data/gel-params.js'; // was: FY
import { getOwnerDocument } from './video-loader.js'; // was: V4
import { writeMessageField } from '../proto/varint-decoder.js'; // was: Lo
import { disableSsdai } from '../ads/ad-cue-delivery.js'; // was: pE
import { safeClearTimeout, safeSetTimeout } from '../core/composition-helpers.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { toString } from '../core/string-utils.js';
import { getPlayerState } from './playback-bridge.js';
import { globalScheduler } from '../core/scheduler.js';
// TODO: resolve g.Fd
// TODO: resolve g.h
// TODO: resolve g.lA
// TODO: resolve g.pl

/**
 * Time Tracking — current time tracking, live head detection, duration
 * calculations, live status checking, and stream resumption.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: ~99500–100500
 *
 * All methods in this file belong to the g.Ff (VideoPlayer) class which
 * extends g.W1, plus the immediately-following prototype assignments and
 * the h5 audio-label map.
 *
 * Key subsystems:
 *   - CSI timing data propagation (Iv) — startup performance logging
 *   - Progress tracking (kx) — buffer underrun detection, progress-
 *     fix transitions, centralized player-time monitoring
 *   - Current time retrieval (getCurrentTime, Np, TH, k_, sR, A6, Kk)
 *   - Duration calculation (getDuration, UN — drift-from-head)
 *   - Live head tracking (qE — effective live edge, v4/bC — seekable
 *     start, TU — seekable end, isAtLiveHead)
 *   - Stream time offset (NQ, getStreamTimeOffset, rW)
 *   - Playback rate management (setPlaybackRate, getPlaybackRate)
 *   - Quality introspection (getPlaybackQuality, isHdr)
 *   - Ah — live stream activation/deactivation and loader
 *     resume/pause
 *   - Diagnostic info (AU, I1, wA) — stats snapshots for debug
 *     overlays
 *   - Attestation flow (Dx) — BotGuard / RTA challenge-response
 *   - Error forwarding (I$, Ek, pz, i$, e9, Yr)
 *   - Miscellaneous: Bz (soft timeout), ly (duration change),
 *     setLoop/mE, playback-quality reporting, and the Ff prototype
 *     timer constants (D0, SQ, q6, f2, q3)
 *
 * [was: methods on g.Ff — Iv, kx, Ek, Tw, qz, OO, p$, QW, Mc, Lh,
 *  Yk, sN, Bz, ly, Dx, qE, v4, TU, bC, NQ, getStreamTimeOffset, rW,
 *  setPlaybackRate, getPlaybackRate, getPlaybackQuality, isHdr,
 *  sendVideoStatsEngageEvent, zm, isAtLiveHead, UN, Ah, iO, F9, zk,
 *  Kg, tL, NS, lT, Kt, A_, setLoop, mE, jR, A3, Tm, eX, tJ, n$,
 *  I$, vk, eV, UU, e9, Yr, pz, i$, jM, getPlayerSize, rM, X_, N$,
 *  getVolume, Xg, isMuted, FM, Ht, X, Ty, mQ, AL, zE, kH, cB, tp,
 *  dw, MY, f4, HY, bS, H7, prefetchKeyPlay, prefetchJumpAhead, bj,
 *  Aw, Au, If, FY, V4, Zr, Lo, Py, J_, RU;
 *  also: g.y = g.Ff.prototype, h5 map, D0/SQ/q6/f2/q3 constants]
 */

// ---------------------------------------------------------------------------
// Iv — CSI startup timing propagation  (lines 99476–99506)
// ---------------------------------------------------------------------------

/**
 * Propagates startup performance metrics to the CSI (Client-Side
 * Instrumentation) timing subsystem.
 *
 * Reads video/audio resource timing entries from `window.performance`
 * (fetch start, DNS, request start, response end) and copies them
 * into the CSI timer.  Also logs the video ID, CPN, itag, preload
 * type, live-stream mode, and paused-on-load status.
 *
 * [was: Iv]
 */
export function propagateStartupTimings(self) { // was: Iv()
  const currentData = self.sO.a$(); // was: Q
  const csiInfo = {}; // was: c
  const playerInfo = {}; // was: W

  if (
    !np("pbs", self.KO.timerName) &&
    mY.measure &&
    mY.getEntriesByName
  ) {
    if (mY.getEntriesByName("mark_nr")[0]) {
      ENw("mark_nr");
    } else {
      ENw();
    }
  }

  if (currentData.videoId) csiInfo.videoId = currentData.videoId;

  if (currentData.clientPlaybackNonce && !self.X("web_player_early_cpn")) {
    csiInfo.clientPlaybackNonce = currentData.clientPlaybackNonce;
  }

  if (self.mediaElement && self.mediaElement.isPaused()) {
    playerInfo.isPausedOnLoad = true; // was: !0
  }

  playerInfo.itag = currentData.O ? Number(currentData.O.itag) : -1;

  if (currentData.isCompressedDomainComposite) {
    playerInfo.preloadType = String(self.pJ ? 2 : 1);
  }

  csiInfo.liveStreamMode = Q3R[kQ(currentData)];
  csiInfo.playerInfo = playerInfo;
  self.KO.infoGel(csiInfo);

  if (self.loader) {
    const timing = self.loader.timing; // was: Q (reused)

    if (window && window.performance && window.performance.getEntriesByName) {
      // Video resource timing
      if (timing.A) {
        const videoEntries = window.performance.getEntriesByName(timing.A); // was: c (reused)
        if (videoEntries.length) {
          const entry = videoEntries[0]; // was: c (reused)
          timing.tick("vri", entry.fetchStart);
          timing.tick("vdns", entry.domainLookupEnd);
          timing.tick("vreq", entry.requestStart);
          timing.tick("vrc", entry.responseEnd);
        }
      }

      // Audio resource timing
      if (timing.O) {
        const audioEntries = window.performance.getEntriesByName(timing.O); // was: c (reused)
        if (audioEntries.length) {
          const entry = audioEntries[0]; // was: c (reused)
          timing.tick("ari", entry.fetchStart);
          timing.tick("adns", entry.domainLookupEnd);
          timing.tick("areq", entry.requestStart);
          timing.tick("arc", entry.responseEnd);
        }
      }
    }

    // Copy all accumulated ticks to the player's CSI timer
    const ticks = timing.ticks; // was: Q (reused)
    for (const key in ticks) { // was: m
      if (ticks.hasOwnProperty(key)) {
        self.KO.tick(key, ticks[key]);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// kx — progress tracking update  (lines 99508–99572)
// ---------------------------------------------------------------------------

/**
 * Core progress-tracking tick, called on every time update and when
 * the player state changes.
 *
 * Responsibilities:
 *   - Updates the seek-timeline's progress state (vQW).
 *   - When using centralized player time, detects stalls and resumes
 *     the loader.
 *   - Forwards the current time to the loader via EM_.
 *   - Logs diagnostic data when the centralized time drifts from the
 *     loader's time by more than 10 seconds.
 *   - Records the last known playback position (UO.A).
 *   - Schedules a buffer-underrun detection callback that inspects
 *     buffered ranges and transitions to buffering (1) or ended (14)
 *     state when appropriate.
 *   - Updates videoData.iX (last known time), triggers format
 *     re-evaluation (fmw/d3), publishes "progresssync", and when
 *     paused on a server-stitched stream publishes "onVideoProgress".
 *
 * [was: kx]
 *
 * @param {boolean} [isProgressSync=false]  When true, suppresses
 *   certain side-effects (e.g. Rid).
 */
export function updateProgress(self, isProgressSync = false) { // was: kx(Q=!1)
  if (!self.mediaElement || !self.videoData) return;

  updateLiveBufferState(self.installPolyfill, self.isPlaying());

  const currentTime = self.getCurrentTime(); // was: c

  // Centralized player-time stall detection
  if (self.loader) {
    if (self.X("html5_use_centralized_player_time") && Qk(self.hY, currentTime) && self.AL) {
      self.AL();
    }
    if (
      (self.playerState.W(4) && g.pl(self.videoData)) ||
      (self.playerState.W(32) && shouldUseSabr(self.videoData))
    ) {
      // skip loader time update while paused on SSAI or seeking on manifest-less
    } else {
      handleSegmentTimestamp(self.loader, currentTime);
    }

    // Diagnostic: detect large time drift
    if (
      self.X("html5_log_centralized_player_time") &&
      Math.abs(self.getCurrentTime() - self.loader.UH()) > 10
    ) {
      self.RetryTimer("sabrSeekRefactorCmt", {
        cmt: self.getCurrentTime(),
        loaderCmt: self.loader?.UH(),
        OnLayoutSelfExitRequestedTrigger: self.loader?.parseHexColor(),
      }, true); // was: !0
    }
  }

  if (currentTime > 5) {
    self.installPolyfill.A = currentTime;
  }

  const useRequestAnimationFrame = g.Fd(); // was: W
  if (useRequestAnimationFrame) {
    globalScheduler.Q$(self.IV);
  } else {
    safeClearTimeout(self.IV);
  }

  const isPaused = self.mediaElement.isPaused(); // was: m

  if (
    (self.playerState.isBuffering() || !isPaused || self.videoData.Ie()) &&
    !self.playerState.W(128)
  ) {
    /**
     * Buffer-underrun detection callback: checks whether the current
     * position has adequate buffer and transitions to the appropriate
     * state (buffering, ended, or clears the buffering flag).
     */
    const checkBuffer = () => { // was: K
      if (!self.mediaElement || self.playerState.W(128)) return;

      if (self.FI.cB()) Cp_(self, "pfx");

      let adjustedTime = self.getCurrentTime(); // was: T
      if (self.X("html5_buffer_underrun_transition_fix")) {
        adjustedTime -= self.getStreamTimeOffsetNQ;
      }

      const bufferHealth = getTimeInBuffer(self.mediaElement); // was: r
      const isPlaying = self.playerState.W(8); // was: U
      const hasEnoughBuffer = Qk(self.hY, adjustedTime); // was: I
      const isBufferHealthy = sdy(self.hY, adjustedTime, (0, g.h)(), bufferHealth); // was: X

      if (isPlaying && hasEnoughBuffer) {
        // Sufficient buffer — clear buffering flag
        self.OO(clearStateBits(self.playerState, 1));
      } else if (isPlaying && isBufferHealthy) {
        // Buffer health check detected a stall near the end
        if (
          self.FI.cB() &&
          self.X("html5_log_centralized_player_time") &&
          !isFinite(adjustedTime) &&
          isBufferHealthy
        ) {
          self.RetryTimer("sabrSeekRefactorCmtBhFix", {
            cmt: adjustedTime,
            loaderCmt: self.loader?.UH(),
            OnLayoutSelfExitRequestedTrigger: self.loader?.parseHexColor(),
          });
        }

        const duration = self.getDuration(); // was: U (reused)
        const isLive = v4(self.videoData); // was: I (reused)

        if (duration && Math.abs(duration - adjustedTime) < 1.1) {
          // Near the end — treat as ended
          self.RetryTimer("setended", {
            ct: adjustedTime,
            OnLayoutSelfExitRequestedTrigger: bufferHealth,
            dur: duration,
            live: isLive,
          });

          if (self.mediaElement.isLooping) {
            self.seekTo(0, {
              Z7: "videoplayer_loop",
              seekSource: 37,
            });
          } else {
            self.Sn(); // signal ended
          }
        } else {
          // Genuine buffer underrun
          if (!self.playerState.isBuffering()) {
            Cf(self, "progress_fix");
          }
          self.OO(addStateBits(self.playerState, 1));
        }
      } else {
        // Not playing — miscellaneous stall checks
        if (isPlaying && !hasEnoughBuffer && !isBufferHealthy && adjustedTime > 0) {
          const elapsedSinceStart = (Date.now() - self.Y4) / 1e3; // was: U (reused)
          const totalDuration = self.getDuration(); // was: I (reused)
          if (adjustedTime > totalDuration - 1) {
            self.RetryTimer("misspg", {
              t: adjustedTime.toFixed(2),
              d: totalDuration.toFixed(2),
              r: elapsedSinceStart.toFixed(2),
              OnLayoutSelfExitRequestedTrigger: bufferHealth.toFixed(2),
            });
          }
        }

        if (
          self.playerState.isPaused() &&
          self.playerState.isBuffering() &&
          getTimeInBuffer(self.mediaElement) > 5
        ) {
          self.OO(clearStateBits(self.playerState, 1));
        }
      }

      self.kx(); // reschedule
    };

    // Schedule the buffer check at 100ms (no buffer) or 500ms (has buffer)
    const delay = self.mediaElement.K().length === 0 ? 100 : 500;
    self.IV = useRequestAnimationFrame
      ? globalScheduler.SlotIdFulfilledNonEmptyTrigger(checkBuffer, delay)
      : safeSetTimeout(checkBuffer, delay);
  }

  self.videoData.readRepeatedMessageField = currentTime;

  if (!isProgressSync && self.isPlaying()) Rid(self);

  if (detectFrameDropDegradation(self.aR, self.z1, self.Yx(), self.isBackground())) {
    applyQualityConstraint(self); // re-evaluate adaptive format
  }

  self.publish("progresssync", isProgressSync);

  if (isPaused && self.videoData.Ie()) {
    self.publish("onVideoProgress", self.getCurrentTime());
  }
}

// ---------------------------------------------------------------------------
// Ek — ad rebuffer timeout  (line 99573–99575)
// ---------------------------------------------------------------------------

/**
 * Reports an "ad.rebuftimeout" error with the current player state
 * hex code.
 *
 * [was: Ek]
 */
export function reportAdRebufferTimeout(self) { // was: Ek()
  self.o$(
    "ad.rebuftimeout",
    2,
    "RETRYABLE_ERROR",
    `vps.${self.playerState.state.toString(16)}`,
  );
}

// ---------------------------------------------------------------------------
// Tw, qz — QoE and bandwidth helpers  (lines 99576–99581)
// ---------------------------------------------------------------------------

/**
 * Returns the throughput watermark from the QoE tracker.
 * [was: Tw]
 * @returns {number}
 */
export function getThroughputWatermark(self) { // was: Tw()
  return self.Vp.getThroughputWatermark;
}

/**
 * Returns the quality zone from the loader or falls back to the
 * buffer policy.
 * [was: qz]
 */
export function getQualityZone(self) { // was: qz()
  return self.loader ? self.loader.getQualityZone : computeBandwidthEstimate(self.Qp, true); // was: !0
}

// ---------------------------------------------------------------------------
// getCurrentTime and related accessors  (lines 99019–99055)
// ---------------------------------------------------------------------------

/**
 * Returns the current playback time in seconds.
 *
 * Delegates to the seek timeline (UO).
 *
 * [was: getCurrentTime]
 *
 * @param {boolean} [raw=false]  If true, returns the raw time
 *   without smoothing.
 * @returns {number}
 */
export function getCurrentTime(self, raw = false) { // was: getCurrentTime(Q=!1)
  return self.installPolyfill.getCurrentTime(raw);
}

/**
 * Returns the "now playing" position for display.
 * [was: Np]
 * @returns {number}
 */
export function getNowPlayingPosition(self) { // was: Np()
  return self.installPolyfill.getNowPlayingPosition;
}

/**
 * Returns the time-head position.
 * [was: TH]
 * @returns {number}
 */
export function getTimeHead(self) { // was: TH()
  return self.installPolyfill.getTimeHead;
}

/**
 * Alias for getTimeHead.
 * [was: k_]
 * @returns {number}
 */
export function getTimeHeadAlias(self) { // was: k_()
  return self.getTimeHead;
}

/**
 * Returns the seekable range from the seek timeline.
 * [was: sR]
 * @returns {*}
 */
export function getSeekableRange(self) { // was: sR()
  return self.installPolyfill.getSeekableRange;
}

/**
 * Returns the playlist sequence number for a given absolute time.
 *
 * Adjusts the time by subtracting the stream time offset (NQ).
 *
 * [was: getPlaylistSequenceForTime]
 *
 * @param {number} time  Absolute time in seconds.
 * @returns {number}
 */
export function getPlaylistSequenceForTime(self, time) { // was: getPlaylistSequenceForTime(Q)
  return self.videoData.getPlaylistSequenceForTime(time - self.getStreamTimeOffsetNQ);
}

/**
 * Returns the media-element's current time, falling back to
 * getCurrentTime if the element reports a negative value.
 *
 * [was: A6]
 *
 * @returns {number}
 */
export function getMediaElementTime(self) { // was: A6()
  let time = NaN; // was: Q
  if (self.mediaElement) {
    time = self.mediaElement.getMediaElementTime;
  }
  return time >= 0 ? time : self.getCurrentTime();
}

/**
 * Returns the wall-clock time (epoch seconds) corresponding to the
 * current playback position in a live stream.
 *
 * First tries the videoData.W.Kk method (manifest-based), then falls
 * back to the media element's program date-time (jG).
 *
 * [was: Kk]
 *
 * @returns {number} Epoch seconds, or NaN if unavailable.
 */
export function getWallClockTime(self) { // was: Kk()
  if (self.videoData.W?.Kk) {
    return self.videoData.W.Kk(self.getCurrentTime() - self.getStreamTimeOffsetNQ);
  }

  if (self.mediaElement) {
    const programDateTime = self.mediaElement.jG(); // was: Q
    if (programDateTime) {
      const epochMs = programDateTime.getTime(); // was: Q (reused)
      if (!isNaN(epochMs)) {
        return epochMs / 1e3 + self.getCurrentTime();
      }
    }
  }

  return NaN;
}

// ---------------------------------------------------------------------------
// getDuration  (lines 99053–99055)
// ---------------------------------------------------------------------------

/**
 * Returns the total duration of the current video in seconds.
 *
 * Prefers `videoData.lengthSeconds` (from the innertube response),
 * offset by the stream time offset (NQ).  Falls back to the seekable
 * end (TU) from the seek timeline.
 *
 * [was: getDuration]
 *
 * @returns {number} Duration in seconds, or 0 if unknown.
 */
export function getDuration(self) { // was: getDuration()
  if (self.videoData.lengthSeconds) {
    return self.videoData.lengthSeconds + self.getStreamTimeOffsetNQ;
  }
  return self.TU() ? self.TU() : 0;
}

// ---------------------------------------------------------------------------
// AU — stats snapshot for debug overlay  (lines 99056–99087)
// ---------------------------------------------------------------------------

/**
 * Builds a comprehensive stats snapshot (D9v) for the debug overlay
 * and diagnostic reporting.
 *
 * Populates video/audio buffer health, bandwidth estimate, latency
 * from live head, dropped/total video frames, and segment-level
 * quality info.
 *
 * [was: AU]
 *
 * @returns {Object} D9v stats object.
 */
export function getStatsSnapshot(self) { // was: AU()
  const stats = new SeekSnapshot(); // was: Q

  if (self.loader) {
    populateBandwidthTelemetry(self.Qp, stats, self.FI.cB());

    const loader = self.loader; // was: c
    if (loader.loadVideoFromData && loader.loadVideoFromData.K && !loader.loadVideoFromData.NK()) {
      stats.sendFinalFlush = getBufferHealth(loader.videoTrack);  // video buffer health
      stats.O = getBufferHealth(loader.audioTrack);   // audio buffer health

      if (loader.policy.A) {
        const videoQueue = fE(loader.videoTrack); // was: W
        const audioQueue = fE(loader.audioTrack); // was: m
        const videoBuffered = onApplicationStateChange(loader.loadVideoFromData.O.NoOpLogger(), "_", 5); // was: K
        const audioBuffered = onApplicationStateChange(loader.loadVideoFromData.W.NoOpLogger(), "_", 5); // was: T

        Object.assign(stats.W, {
          lvq: videoQueue,
          laq: audioQueue,
          lvb: videoBuffered,
          lab: audioBuffered,
        });
      }
    }

    stats.bandwidthEstimate = getEffectiveBandwidth(loader.Y);
    loader.audioTrack.L?.flush();
    loader.videoTrack.L?.flush();
  } else if (self.mediaElement) {
    stats.sendFinalFlush = getTimeInBuffer(self.mediaElement);
  }

  stats.Ry = self.Ry;
  stats.f7 = self.f7;
  stats.A = (self.isAtLiveHead() && self.isPlaying()) ? getLiveBroadcastTime(self) : NaN;

  const seekTimeline = self.installPolyfill; // was: c (reused)
  const seekCount = seekTimeline.W ? m6(seekTimeline.W) : 0; // was: c (reused)
  stats.j = seekCount;

  return stats;
}

// ---------------------------------------------------------------------------
// Tt — accumulate transferred bytes  (lines 99088–99091)
// ---------------------------------------------------------------------------

/**
 * Accumulates byte-transfer counters for diagnostic reporting.
 *
 * [was: Tt]
 *
 * @param {number} videoBytes  Additional video bytes transferred.
 * @param {number} audioBytes  Additional audio bytes transferred.
 */
export function accumulateTransferredBytes(self, videoBytes, audioBytes) { // was: Tt(Q, c)
  self.f7 += videoBytes;
  self.Ry += audioBytes;
}

// ---------------------------------------------------------------------------
// TV — load fraction  (lines 99092–99094)
// ---------------------------------------------------------------------------

/**
 * Returns the fraction of the video that has been loaded (0..1).
 *
 * For SSAI streams returns 1.  For manifest-less live, returns 1 if
 * at the live head or pegged-to-live, otherwise delegates to the
 * seek timeline.  For VOD, delegates to the media element.
 *
 * [was: TV]
 *
 * @returns {number} Load fraction 0..1.
 */
export function getLoadFraction(self) { // was: TV()
  if (!self.mediaElement) return 0;
  if (g.pl(self.videoData)) return 1;
  if (QS(self.videoData)) {
    return (self.isAtLiveHead() || self.kU()) ? 1 : self.installPolyfill.getLoadFraction;
  }
  return self.mediaElement.getLoadFraction;
}

// ---------------------------------------------------------------------------
// I1 — debug info for the stats-for-nerds panel  (lines 99095–99158)
// ---------------------------------------------------------------------------

/**
 * Builds the debug information dictionary displayed in the
 * "Stats for Nerds" overlay.
 *
 * [was: I1]
 *
 * @returns {Object} Dictionary with keys like P2 (bandwidth), rJ
 *   (buffer health), currentTime, droppedVideoFrames, etc.
 */
export function getDebugInfo(self) { // was: I1()
  const debugMonitor = self.Lm; // was: Q

  const bandwidthSample = t5(debugMonitor, "bandwidth"); // was: c
  const bufferHealthSample = t5(debugMonitor, "bufferhealth"); // was: W
  const liveLatencySample = t5(debugMonitor, "livelatency"); // was: m
  const networkActivitySample = t5(debugMonitor, "networkactivity"); // was: K

  const bandwidthDisplay = Dy(debugMonitor, "bandwidth"); // was: T
  const bufferHealthDisplay = Dy(debugMonitor, "bufferhealth"); // was: r
  const liveLatencyDisplay = Dy(debugMonitor, "livelatency"); // was: U
  const networkActivityDisplay = Dy(debugMonitor, "networkactivity"); // was: Q (reused)

  const videoQuality = self.removeTimeupdateListener(); // was: I
  const droppedVideoFrames = videoQuality.droppedVideoFrames; // was: X
  const totalVideoFrames = videoQuality.totalVideoFrames; // was: I (reused)

  const currentTime = self.getCurrentTime(); // was: A

  // Build the IT (internal transport) debug string
  let internalTransport; // was: e
  if (self.Y1) {
    internalTransport = "IT/" + (self.Y1.W.getInfo() + "/" + getQualityLabel(self.PluginSlotHolder()));
    internalTransport += "/" + self.Y1.getInfo();
  } else {
    internalTransport = "";
  }

  const isGapless = self.isGapless(); // was: V
  const connectionType = self.Bc(); // was: B
  const playerVersion = self.Zr(); // was: n
  const throughputWatermark = self.getThroughputWatermark; // was: S
  const optimalFormat = g.lA(self); // was: d
  const playerStateHex = self.getPlayerState().state.toString(16); // was: b
  const playlistSequence = self.getPlaylistSequenceForTime(self.getCurrentTime()); // was: w

  // Build the ad-debug prefix string
  let adDebugPrefix; // was: f, G block
  {
    let adCount = 0; // was: f
    let adIdPrefix = ""; // was: G

    if (self.Z1) {
      if (self.Z1.ol) {
        adDebugPrefix = "D,";
      } else {
        adCount = self.Z1.NR;
        adIdPrefix = self.Z1.getNFOffset.substring(0, 4);

        if (adCount > 0) {
          let result = `AD${adCount}, `; // was: f (reused)
          if (adIdPrefix) {
            result += `${adIdPrefix}, `;
          }
          adDebugPrefix = result;
        } else {
          adDebugPrefix = "";
        }
      }
    } else {
      adDebugPrefix = "";
    }
  }

  return {
    readUint64: bandwidthDisplay,
    rJ: bufferHealthDisplay,
    currentTime,
    findChapterAtPixel: internalTransport,
    droppedVideoFrames,
    isGapless,
    Bc: connectionType,
    Zr: playerVersion,
    cY: throughputWatermark,
    Nv: bandwidthSample,
    selectNextQuality: bufferHealthSample,
    needsLiveRefresh: liveLatencySample,
    AdText: networkActivitySample,
    listenOnPlayerRoot: liveLatencyDisplay,
    hV: networkActivityDisplay,
    Y9: optimalFormat,
    a6: playerStateHex,
    p9: playlistSequence,
    qx: adDebugPrefix,
    totalVideoFrames,
  };
}

// ---------------------------------------------------------------------------
// wA — diagnostic dump  (lines 99159–99194)
// ---------------------------------------------------------------------------

/**
 * Returns a diagnostic key-value dump for error reporting and debug
 * tools.
 *
 * When `verbose` is true, includes QoE stats, media-element state,
 * loader state, DRM state, player state, preroll list, latency class,
 * live metadata, optimal format, user quality, and release version.
 *
 * Always includes `debug_videoId`.
 *
 * [was: wA]
 *
 * @param {boolean} [verbose=false]
 * @returns {Object} Key-value diagnostic data.
 */
export function getDiagnosticDump(self, verbose = false) { // was: wA(Q=!1)
  const data = {}; // was: c

  if (verbose) {
    Object.assign(data, self.Vp.isGaplessShortEligible());

    if (self.mediaElement) {
      Object.assign(data, self.mediaElement.isGaplessShortEligible());
      const quality = self.removeTimeupdateListener(); // was: Q (reused)
      data.dvf = quality.droppedVideoFrames;
      data.tvf = quality.totalVideoFrames;
    }

    if (self.loader) Object.assign(data, self.loader.isGaplessShortEligible());

    if (self.Y1) {
      data.drm = JSON.stringify(self.Y1.isGaplessShortEligible());
    }

    data.state = self.playerState.state.toString(16);

    if (self.playerState.W(128)) {
      data.debug_error = JSON.stringify(self.playerState.Dr);
    }

    if (self.KB()) {
      data.prerolls = self.qL.join(",");
    }

    if (self.videoData.zeroPad) {
      data.ismb = self.videoData.zeroPad;
    }

    if (self.videoData.latencyClass !== "UNKNOWN") {
      data.latency_class = self.videoData.latencyClass;
    }

    if (self.getExperimentFlags.W.BA(P4) ? lb(self.videoData) : self.videoData.isLowLatencyLiveStream) {
      data.lowlatency = "1";
    }

    if (
      self.videoData.defaultActiveSourceVideoId ||
      self.videoData.compositeLiveStatusToken ||
      self.videoData.compositeLiveIngestionOffsetToken
    ) {
      data.is_mosaic = 1;
    }

    if (self.videoData.cotn) {
      data.is_offline = 1;
      data.cotn = self.videoData.cotn;
    }

    if (self.videoData.playerResponseCpn) {
      data.playerResponseCpn = self.videoData.playerResponseCpn;
    }

    if (self.sO.isOrchestrationLeader()) {
      data.leader = 1;
    }

    if (self.videoData.isLivePlayback) {
      if (self.videoData.W && getAverageSegmentDuration(self.videoData.W)) {
        data.segduration = getAverageSegmentDuration(self.videoData.W);
      }

      const seekTimeline = self.installPolyfill; // was: Q (reused)
      data.lat = seekTimeline.L ? seekTimeline.L.j.A() : 0;
      data.liveutcstart = self.videoData.liveUtcStartSeconds;
    }

    data.relative_loudness = self.videoData.Af.toFixed(3);

    const optimalFormat = g.lA(self); // was: Q (reused)
    if (optimalFormat) {
      data.optimal_format = optimalFormat.video.qualityLabel;
    }

    data.user_qual = getPersistedQuality();
    data.release_version = "youtube.player.web_20260324_03_RC00";
  }

  data.debug_videoId = self.videoData.videoId;
  return data;
}

// ---------------------------------------------------------------------------
// isAtLiveHead  (lines 100001–100003)
// ---------------------------------------------------------------------------

/**
 * Returns whether the player is currently at the live edge of a
 * live stream.
 *
 * Only returns true when the video data indicates a live-head-
 * playable stream (v4) and the player's live-tracking flag (tH) is
 * set (or `force` is true).
 *
 * [was: isAtLiveHead]
 *
 * @param {*} [tolerance]        Tolerance parameter forwarded to
 *   the seek timeline.
 * @param {boolean} [force=false]  Bypass the tH guard.
 * @returns {boolean}
 */
export function isAtLiveHead(self, tolerance, force = false) { // was: isAtLiveHead(Q, c=!1)
  return v4(self.videoData) && (self.tH || force)
    ? self.installPolyfill.isAtLiveHead(tolerance)
    : false; // was: !1
}

// ---------------------------------------------------------------------------
// UN — drift from live head  (lines 100004–100011)
// ---------------------------------------------------------------------------

/**
 * Returns the number of seconds the current playback position is
 * behind the live head.
 *
 * Used for the "DRIFT_FROM_HEAD_MS" CSI metric (multiplied by 1000)
 * and for ad-break scheduling decisions.
 *
 * Returns 0 when:
 *   - The stream is not live-head-playable (v4 returns false).
 *   - The seek timeline has no active live-head tracker.
 *   - The player is pegged-to-live (kU).
 *   - Either TU or getCurrentTime returns NaN.
 *
 * [was: UN]
 *
 * @returns {number} Seconds behind live head (>= 0), or 0 if not
 *   applicable.
 */
export function getDriftFromHead(self) { // was: UN()
  const seekableEnd = self.TU(); // was: Q
  const currentTime = self.getCurrentTime(); // was: c

  let notLive; // was: W
  notLive = !v4(self.videoData);

  if (!notLive) {
    const seekTimeline = self.installPolyfill; // was: W (reused)
    notLive = !(seekTimeline.W && seekTimeline.W.A);
  }

  if (notLive || self.kU() || isNaN(seekableEnd) || isNaN(currentTime)) {
    return 0;
  }

  return Math.max(0, seekableEnd - currentTime);
}

// ---------------------------------------------------------------------------
// Ah — activate / deactivate live stream  (lines 100012–100027)
// ---------------------------------------------------------------------------

/**
 * Activates or deactivates live-stream tracking and loader
 * resume/pause behaviour.
 *
 * When activated:
 *   - Resumes the manifest update timer (videoData.W.resume).
 *   - Resumes the loader unless SSDAI preroll conditions prevent it.
 *   - Clears the 512 (paused-for-ads) state if it was set.
 *   - Logs stream mode "A" (active) to QoE.
 *
 * When deactivated:
 *   - Stops the Xm timer and the manifest update timer.
 *   - Pauses the loader via T2.
 *   - Sets the 512 state (unless already ended/2).
 *   - Logs stream mode "I" (inactive) to QoE.
 *
 * [was: Ah]
 *
 * @param {boolean} active  Whether to activate (true) or deactivate
 *   (false).
 */
export function setLiveStreamActive(self, active) { // was: Ah(Q)
  self.tH = active;

  if (!active) self.SLOT_ARRAY_STATE.stop();

  if (self.videoData.W) {
    if (active) {
      self.videoData.W.resume();
    } else {
      const manifest = self.videoData.W; // was: c
      if (manifest.K) manifest.K.stop();
    }
  }

  if (self.loader) {
    const blockResume = // was: c (reused)
      self.videoData.X("html5_disable_preload_for_ssdai_with_preroll") &&
      self.iterateCursor() &&
      self.videoData.isLivePlayback;

    if (active && !blockResume) {
      self.loader.resume();
    } else {
      self.loader?.T2(true); // was: !0
    }
  }

  if (self.playerState.W(2) || active) {
    if (self.playerState.W(512) && active) {
      self.OO(clearStateBits(self.playerState, 512));
    }
  } else {
    self.OO(addStateBits(self.playerState, 512));
  }

  const qoeTracker = self.Vp; // was: c (reused)
  if (qoeTracker.qoe) {
    const qoe = qoeTracker.qoe; // was: c (reused)
    recordTimedStat(qoe, getYtNow(qoe.provider), "stream", [active ? "A" : "I"]);
  }
}

// ---------------------------------------------------------------------------
// qE — effective live edge  (lines 99950–99952)
// ---------------------------------------------------------------------------

/**
 * Returns the effective live edge time.
 *
 * For live-head-playable streams where the player is at the live head
 * and not paused, or pegged-to-live, or using SSAI, returns
 * getCurrentTime.  Otherwise falls back to the seekable end (TU).
 *
 * [was: qE]
 *
 * @param {boolean} [raw=false]  Passed to TU for raw seekable end.
 * @returns {number}
 */
export function getEffectiveLiveEdge(self, raw = false) { // was: qE(Q=!1)
  if (
    v4(self.videoData) &&
    ((self.isAtLiveHead() && !self.playerState.isPaused()) ||
      self.kU() ||
      g.pl(self.videoData))
  ) {
    return self.getCurrentTime();
  }
  return self.TU(raw);
}

// ---------------------------------------------------------------------------
// v4 (alias), TU, bC, NQ, getStreamTimeOffset, rW  (lines 99953–99970)
// ---------------------------------------------------------------------------

/**
 * Returns the seekable start from the seek timeline.
 * [was: v4 — on g.Ff, delegates to bC]
 * @returns {number}
 */
export function getSeekableStart(self) { // was: v4()
  return self.getSeekableRangeStart;
}

/**
 * Returns the seekable end from the seek timeline.
 * [was: TU]
 * @param {boolean} [raw=false]
 * @returns {number}
 */
export function getSeekableEnd(self, raw = false) { // was: TU(Q=!1)
  return self.installPolyfill.TU(raw);
}

/**
 * Returns the seekable-range start time from the seek timeline.
 * [was: bC]
 * @returns {number}
 */
export function getSeekableRangeStart(self) { // was: bC()
  return self.installPolyfill.getSeekableRangeStart;
}

/**
 * Returns the stream time offset (NQ), or 0 if the seek timeline
 * is not initialized.
 *
 * This offset is added to all displayed times to convert from
 * media-element time to presentation time.
 *
 * [was: NQ]
 *
 * @returns {number}
 */
export function getStreamTimeOffsetNQ(self) { // was: NQ()
  return self.installPolyfill ? self.installPolyfill.getStreamTimeOffsetNQ : 0;
}

/**
 * Returns the raw stream time offset from the seek timeline, or 0.
 * [was: getStreamTimeOffset]
 * @returns {number}
 */
export function getStreamTimeOffset(self) { // was: getStreamTimeOffset()
  return self.installPolyfill ? self.installPolyfill.getStreamTimeOffset() : 0;
}

/**
 * Returns the effective stream offset: uses getStreamTimeOffset if
 * non-zero, otherwise falls back to NQ.
 *
 * [was: rW]
 *
 * @returns {number}
 */
export function getEffectiveStreamOffset(self) { // was: rW()
  return self.getStreamTimeOffset() === 0 ? self.getStreamTimeOffsetNQ : self.getStreamTimeOffset();
}

// ---------------------------------------------------------------------------
// Playback rate  (lines 99971–99978)
// ---------------------------------------------------------------------------

/**
 * Sets the playback rate, triggering a format re-evaluation (d3)
 * when the rate changes and the format supports adaptation.
 *
 * [was: setPlaybackRate]
 *
 * @param {number} rate  Desired playback rate (e.g. 1, 1.5, 2).
 */
export function setPlaybackRate(self, rate) { // was: setPlaybackRate(Q)
  if (self.playbackRate !== rate && vP(self.aR, self.videoData.A?.videoInfos)) {
    self.playbackRate = rate;
    applyQualityConstraint(self); // re-evaluate format for the new rate
  }
  self.playbackRate = rate;
  if (self.mediaElement) self.mediaElement.setPlaybackRate(rate);
}

/**
 * Returns the current playback rate.
 * [was: getPlaybackRate]
 * @returns {number}
 */
export function getPlaybackRate(self) { // was: getPlaybackRate()
  return self.playbackRate;
}

// ---------------------------------------------------------------------------
// Quality introspection  (lines 99980–99991)
// ---------------------------------------------------------------------------

/**
 * Returns the current playback quality label (e.g. "hd720", "large").
 *
 * For "auto" quality, inspects the actual video dimensions of the
 * media element to derive the effective quality.
 *
 * [was: getPlaybackQuality]
 *
 * @returns {string}
 */
export function getPlaybackQuality(self) { // was: getPlaybackQuality()
  let quality = "unknown"; // was: Q

  if (self.videoData.O) {
    quality = self.videoData.O.video.quality;

    if (quality === "auto" && self.mediaElement) {
      const videoSize = self.removeRootClass(); // was: c
      if (videoSize && videoSize.videoHeight > 0) {
        quality = getQualityLabel(videoSize.videoWidth, videoSize.videoHeight);
      }
    }
  }

  return quality;
}

/**
 * Returns whether the current format is HDR.
 * [was: isHdr]
 * @returns {boolean}
 */
export function isHdr(self) { // was: isHdr()
  return !!(
    self.videoData.O &&
    self.videoData.O.video &&
    self.videoData.O.video.isHdr()
  );
}

// ---------------------------------------------------------------------------
// Video stats engagement  (lines 99992–99997)
// ---------------------------------------------------------------------------

/**
 * Sends a video-stats "engage" event.
 *
 * [was: sendVideoStatsEngageEvent]
 *
 * @param {*} engageData      Engagement payload (b0 field).
 * @param {Function} [callback]  Optional callback invoked after send.
 */
export function sendVideoStatsEngageEvent(self, engageData, callback) { // was: sendVideoStatsEngageEvent(Q, c)
  const tracker = self.Vp; // was: W
  if (tracker.W) {
    const engageEvent = uc(tracker.W, "engage"); // was: W (reused)
    engageEvent.isSamsungSmartTV = engageData;
    engageEvent.send(callback);
  } else if (callback) {
    callback();
  }
}

/**
 * Delegates a zm call to the QoE tracker.
 * [was: zm]
 */
export function delegateZm(self, param) { // was: zm(Q)
  return self.Vp.actionCompanionAdRenderer(param);
}

// ---------------------------------------------------------------------------
// iO — log player exception  (lines 100028–100033)
// ---------------------------------------------------------------------------

/**
 * Logs a player exception to the QoE system.
 *
 * [was: iO]
 *
 * @param {Error} error  The exception to log.
 */
export function logPlayerException(self, error) { // was: iO(Q)
  self.Vp.I$("player.exception", Tb({
    n: error.name,
    m: error.message,
  }));
}

// ---------------------------------------------------------------------------
// F9, zk, Kg, tL, NS — QoE forwarding  (lines 100034–100048)
// ---------------------------------------------------------------------------

/** [was: F9] */
export function forwardF9(self, data) { self.Vp.F9(data); }
/** [was: zk] */
export function forwardZk(self, data) { self.Vp.zk(data); }
/** [was: Kg] */
export function forwardKg(self, data) { self.Vp.Kg(data); }
/** [was: tL] */
export function forwardTL(self, data) { self.Vp.tL(data); }
/** [was: NS] */
export function forwardNS(self, a, b, c, d) { self.Vp.NS(a, b, c, d); }

// ---------------------------------------------------------------------------
// lT — log hidden event  (line 100049–100051)
// ---------------------------------------------------------------------------

/**
 * Logs a "hidden" telemetry event (page or tab went out of view).
 * [was: lT]
 */
export function logHiddenEvent(self) { // was: lT()
  self.RetryTimer("hidden", {}, true); // was: !0
}

// ---------------------------------------------------------------------------
// Kt — get video playback quality  (lines 100052–100054)
// ---------------------------------------------------------------------------

/**
 * Returns the media element's VideoPlaybackQuality metrics
 * (droppedVideoFrames, totalVideoFrames), or an empty object.
 *
 * [was: Kt]
 *
 * @returns {Object}
 */
export function getVideoPlaybackQuality(self) { // was: Kt()
  return self.mediaElement ? self.mediaElement.getVideoPlaybackQuality() : {};
}

// ---------------------------------------------------------------------------
// A_ — loader availability  (lines 100055–100057)
// ---------------------------------------------------------------------------

/**
 * Returns whether the loader is available for further operations.
 * Defaults to true if no loader exists.
 * [was: A_]
 * @returns {boolean}
 */
export function isLoaderAvailable(self) { // was: A_()
  return self.loader ? self.loader.isLoaderAvailable : true; // was: !0
}

// ---------------------------------------------------------------------------
// setLoop / mE — loop control  (lines 100058–100064)
// ---------------------------------------------------------------------------

/**
 * Enables or disables looped playback.
 *
 * Also propagates to the media element unless the player is in an
 * AI-assisted mode (isTvHtml5).
 *
 * [was: setLoop]
 *
 * @param {boolean} loop
 */
export function setLoop(self, loop) { // was: setLoop(Q)
  self.loop = loop;
  if (self.mediaElement && !isTvHtml5(self.FI)) {
    self.mediaElement.setLoop(loop);
  }
}

/**
 * Returns whether the player is in loop mode.
 *
 * Returns the media element's loop state if available, otherwise
 * the internal flag.
 *
 * [was: mE]
 *
 * @returns {boolean}
 */
export function isLooping(self) { // was: mE()
  return self.mediaElement && !isTvHtml5(self.FI)
    ? self.mediaElement.isLooping
    : self.loop;
}

// ---------------------------------------------------------------------------
// jR — set timestamp origin  (lines 100065–100070)
// ---------------------------------------------------------------------------

/**
 * Sets a timestamp origin on the seek timeline and logs it.
 * [was: jR]
 * @param {*} timestamp
 */
export function setTimestampOrigin(self, timestamp) { // was: jR(Q)
  self.RetryTimer("timestamp", { o: timestamp.toString() });
  self.installPolyfill.jR(timestamp);
}

// ---------------------------------------------------------------------------
// A3, Tm, eX — CSI tick helpers  (lines 100071–100079)
// ---------------------------------------------------------------------------

/**
 * Records a CSI tick at the current time.
 * [was: A3]
 * @param {string} label
 */
export function csiTick(self, label) { // was: A3(Q)
  self.KO.tick(label);
}

/**
 * Returns the CSI timer value for a label.
 * [was: Tm]
 * @param {string} label
 * @returns {number}
 */
export function getCsiTimerValue(self, label) { // was: Tm(Q)
  return self.KO.getTimeInBuffer(label);
}

/**
 * Executes a CSI event marker.
 * [was: eX]
 * @param {string} marker
 */
export function csiEventMarker(self, marker) { // was: eX(Q)
  self.KO.eX(marker);
}

// ---------------------------------------------------------------------------
// tJ, n$ — telemetry event logging  (lines 100080–100085)
// ---------------------------------------------------------------------------

/**
 * Logs a telemetry event with a key and details object.
 * [was: tJ]
 * @param {string} eventKey
 * @param {Object} details
 * @param {boolean} [immediate=false]  Send immediately.
 */
export function logTelemetryEvent(self, eventKey, details, immediate = false) { // was: tJ(Q, c, W=!1)
  self.Vp.RetryTimer(eventKey, details, immediate);
}

/**
 * Alias for logTelemetryEvent (tJ).
 * [was: n$]
 */
export function logTelemetryEventAlias(self, eventKey, details, immediate = false) { // was: n$(Q, c, W=!1)
  self.Vp.RetryTimer(eventKey, details, immediate);
}

// ---------------------------------------------------------------------------
// I$ — log internal error  (lines 100086–100098)
// ---------------------------------------------------------------------------

/**
 * Logs an internal error event and, for live QoE events
 * (qoe.longrebuffer, qoe.slowseek, qoe.restart), also logs the last
 * audio/video stream-output events from the loader.
 *
 * [was: I$]
 *
 * @param {Object} error  PlayerError error instance with `.errorCode` and
 *   `.details`.
 */
export function logInternalError(self, error) { // was: I$(Q)
  self.Vp.I$(error.NetworkErrorCode, Tb(error.details));

  const NetworkErrorCode = error.NetworkErrorCode; // was: Q (reused)

  if (
    (self.videoData.isLivePlayback &&
      (NetworkErrorCode === "qoe.longrebuffer" || NetworkErrorCode === "qoe.slowseek")) ||
    NetworkErrorCode === "qoe.restart"
  ) {
    const audioStreamOutput = self.loader ? e5W(self.loader.audioTrack) : {}; // was: Q (reused)
    const videoStreamOutput = self.loader ? e5W(self.loader.videoTrack) : {}; // was: Q (reused)

    self.RetryTimer("lasoe", Object.assign(audioStreamOutput, self.loadVideoFromData?.W?.Hm()));
    self.RetryTimer("lvsoe", Object.assign(videoStreamOutput, self.loadVideoFromData?.O?.Hm()));
  }

  if (self.X("html5_log_centralized_player_time")) {
    self.RetryTimer("sabrSeekRefactorCmt", {
      cmt: self.getCurrentTime(),
      loaderCmt: self.loader?.UH(),
      OnLayoutSelfExitRequestedTrigger: self.loader?.parseHexColor(),
    });
  }
}

// ---------------------------------------------------------------------------
// Miscellaneous accessors  (lines 100254–100392)
// ---------------------------------------------------------------------------

/**
 * Returns the current QoE timestamp.
 * [was: jM]
 * @returns {number}
 */
export function getQoeTimestamp(self) { // was: jM()
  return getYtNow(self.Vp.provider);
}

/**
 * Returns the player's viewport size.
 * [was: getPlayerSize]
 * @returns {Object}
 */
export function getPlayerSize(self) { // was: getPlayerSize()
  return self.supportsDashOpus.getPlayerSize();
}

/**
 * Returns the player's render mode.
 * [was: rM]
 */
export function getRenderMode(self) { // was: rM()
  return self.supportsDashOpus.globalEventBuffer();
}

/**
 * Returns the CSI timer object.
 * [was: X_]
 * @returns {Object}
 */
export function getCsiTimer(self) { // was: X_()
  return self.KO;
}

/**
 * Returns the N$ value from the orchestrator.
 * [was: N$]
 */
export function getN$(self) { return self.sO.N$(); }

/**
 * Returns the current volume.
 * [was: getVolume]
 * @returns {number}
 */
export function getVolume(self) { return self.sO.getVolume(); }

/**
 * Returns the Xg value from the orchestrator.
 * [was: Xg]
 */
export function getXg(self) { return self.sO.Xg(); }

/**
 * Returns whether the player is muted.
 * [was: isMuted]
 * @returns {boolean}
 */
export function isMuted(self) { return self.sO.isMuted(); }

/**
 * Returns the FM value from the orchestrator.
 * [was: FM]
 */
export function getFM(self) { return self.sO.FM(); }

/**
 * Marks the player as having entered a time-locked (YJ) state.
 * [was: Ht]
 */
export function setTimeLocked(self) { // was: Ht()
  self.YJ = true; // was: !0
}

/**
 * Checks an experiment flag.
 * [was: X]
 * @param {string} flag
 * @returns {boolean}
 */
export function checkExperimentFlag(self, flag) { // was: X(Q)
  return self.FI.X(flag);
}

/**
 * Returns the experiment flags object.
 * [was: Ty]
 */
export function getExperimentFlags(self) { // was: Ty()
  return self.FI.getExperimentFlags;
}

/**
 * Returns the current video ID.
 * [was: MY]
 * @returns {string}
 */
export function getVideoId(self) { // was: MY()
  return self.videoData.videoId;
}

/**
 * Returns the content owner token for the current video.
 * [was: dw]
 * @returns {string|undefined}
 */
export function getContentOwnerToken(self) { // was: dw()
  if (self.videoData.videoId) return self.videoData.iN;
}

/**
 * Returns the orchestrator's Oc (owner channel?) value.
 * [was: f4]
 */
export function getOwnerChannel(self) { return self.sO.bezierY; }

/**
 * Returns whether the player has been internally initialized (IN).
 * [was: HY]
 * @returns {boolean}
 */
export function isInternallyInitialized(self) { return self.IN; }

/**
 * Returns the bS value from the orchestrator.
 * [was: bS]
 */
export function getBS(self) { return self.sO.bS(); }

// ---------------------------------------------------------------------------
// Prefetch and seek helpers  (lines 100348–100392)
// ---------------------------------------------------------------------------

/**
 * Begins a pending seek (H7) with a state transition to 16 (seeking).
 * [was: H7]
 * @param {number} time
 * @param {*} param2
 * @param {*} seekSource
 */
export function beginPendingSeek(self, time, param2, seekSource) { // was: H7(Q, c, W)
  self.OO(addStateBits(self.playerState, 16, seekSource));
  self.installPolyfill.H7(time, param2, seekSource);
}

/**
 * Prefetches a key-play segment.
 * [was: prefetchKeyPlay]
 * @param {*} segmentInfo
 * @param {boolean} flag
 */
export function prefetchKeyPlay(self, segmentInfo, flag) { // was: prefetchKeyPlay(Q, c)
  self.loader?.mainVideoEntityActionMetadataKey(segmentInfo, flag, 2);
}

/**
 * Prefetches a jump-ahead segment.
 * [was: prefetchJumpAhead]
 * @param {*} segmentInfo
 */
export function prefetchJumpAhead(self, segmentInfo) { // was: prefetchJumpAhead(Q)
  self.loader?.mainVideoEntityActionMetadataKey(segmentInfo, false, 3); // was: !1
}

/**
 * Returns the bj value from the seek timeline.
 * [was: bj]
 */
export function getBj(self, param) { // was: bj(Q)
  return self.installPolyfill.bj(param);
}

/**
 * Calls Aw on the seek timeline.
 * [was: Aw]
 */
export function callAw(self) { // was: Aw()
  self.installPolyfill.callAw;
}

/**
 * Forwards an Au call to the orchestrator with optional content PO
 * token data.
 * [was: Au]
 */
export function forwardAu(self, param1, param2) { // was: Au(Q, c)
  const contentPoTokenData = self.X("html5_generate_content_po_token")
    ? self.videoData
    : undefined; // was: void 0
  self.sO.Au(param1, param2, contentPoTokenData);
}

/**
 * Returns whether the iOS 7 hack force-play workaround should be
 * removed.
 * [was: If]
 * @returns {boolean}
 */
export function shouldRemoveIOS7HackForcePlay(self) { // was: If()
  return self.X("html5_remove_ios_7_hack_force_play");
}

// ---------------------------------------------------------------------------
// Remaining delegates  (lines 100371–100392)
// ---------------------------------------------------------------------------

/** [was: FY] */
export function forwardFY(self, a, b) { self.Vp.truncateValue(a, b); }
/** [was: V4] */
export function getV4(self) { return self.Vp.getOwnerDocument(); }
/** [was: Zr] */
export function getZr(self) { return self.sO.Zr(); }
/** [was: Lo] */
export function getLo(self) { return self.sO.writeMessageField(self); }
/** [was: Py] */
export function markPy(self) { self.disableSsdai = true; } // was: !0
/** [was: J_] */
export function forwardJ_(self, param) { self.loader?.J_(param); }
/** [was: RU] */
export function forwardRU(self, param) { self.installPolyfill.RU(param); }

// ---------------------------------------------------------------------------
// Ff prototype timer constants  (lines 100394–100399)
// ---------------------------------------------------------------------------

/**
 * Timer-interval constants assigned to the g.Ff prototype.
 *
 * These use the c3 factory (which converts a numeric ID to a
 * configuration-driven interval in milliseconds).
 *
 * [was: g.y = g.Ff.prototype; g.y.D0/SQ/q6/f2/q3]
 *
 *   D0 = c3(48)  — ~48-tick interval
 *   SQ = c3(31)  — ~31-tick interval
 *   q6 = c3(25)  — ~25-tick interval
 *   f2 = c3(19)  — ~19-tick interval
 *   q3 = c3(13)  — ~13-tick interval
 */
// g.y = g.Ff.prototype;
// g.y.D0 = c3(48);
// g.y.SQ = c3(31);
// g.y.q6 = c3(25);
// g.y.f2 = c3(19);
// g.y.q3 = c3(13);

// ---------------------------------------------------------------------------
// h5 — audio track label map  (lines 100400–100403)
// ---------------------------------------------------------------------------

/**
 * Maps internal audio-track label keys to their display names.
 *
 * [was: h5]
 */
export const audioTrackLabelMap = { // was: h5
  primary: "Primary",
  secondary: "Secondary",
};

/**
 * Get current playback provider time. [was: g.Yo]
 */
export function getYtNow(provider) {
  return provider ? provider.getCurrentTime() : 0;
}
