/**
 * Buffer state tracking and management.
 *
 * Extracted from base.js lines ~42000-45000.
 * Covers TimeRanges/buffered tracking, buffer health monitoring,
 * rebuffer detection, gap jumping, and QoE stat reporting.
 *
 * @module buffer-manager
 */
import { enumReader } from '../proto/message-setup.js'; // was: lt
import { getCurrentTime, getDebugInfo, getDuration } from '../player/time-tracking.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { getEffectiveConnectionType } from '../core/attestation.js';
import { computeReadaheadLimit } from './segment-loader.js';
import { getMediaSource, handleError } from '../player/context-updates.js';
import { isTimeInRange } from './codec-helpers.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { clamp } from '../core/math-utils.js';

// ---------------------------------------------------------------------------
// QoE stats reporting
// ---------------------------------------------------------------------------

/**
 * Logs a timestamped QoE metric entry for the given provider.
 * [was: g.J8]
 *
 * @param {object} qoe - QoE state object [was: Q]
 * @param {number} mediaTime - Media time in seconds [was: c]
 * @param {string} category - Metric category (e.g. "cmt", "bh") [was: W]
 * @param {Array<string>} values - Metric values [was: m]
 */
export function logQoeMetric(qoe, mediaTime, category, values) { // was: g.J8
  addQoeEntry(qoe, mediaTime, `${mediaTime.toFixed(3)}:${values.join(":")}`); // was: MT(Q, W, ...)
}

/**
 * Records current media time ("cmt") and computes glass-to-glass latency
 * when transitioning between ad and content playback.
 * [was: R4]
 *
 * @param {object} qoe - QoE state [was: Q]
 * @param {number} wallTime - Current wall-clock time [was: c]
 */
export function recordCurrentMediaTime(qoe, wallTime) { // was: R4
  const currentTime = qoe.provider.getCurrentTime(); // was: W
  logQoeMetric(qoe, wallTime, "cmt", [currentTime.toFixed(3)]);

  let playerHead = qoe.provider.getPlayerHead(); // was: m = W = Q.provider.TH()
  if ((!qoe.lastTransition || isGaplessContent(qoe.provider.videoData)
       ? false : playerHead * 1000 > qoe.lastTransition.playerHeadMs + 100)
      && qoe.lastTransition) {
    const wasAd = qoe.lastTransition.isAd; // was: m = Q.O.isAd
    const headDelta = playerHead * 1000 - qoe.lastTransition.playerHeadMs; // was: W = W * 1E3 - Q.O.k9
    qoe.glassToGlassLatency = wallTime * 1000 -
      qoe.lastTransition.wallTimeMs - headDelta -
      qoe.lastTransition.bufferingMs; // was: Q.cY

    const correctedWallTime = performance.now() - headDelta; // was: K = (0, g.h)() - W

    const videoData = qoe.provider.videoData;
    const isCurrentAd = videoData.isAd();

    if (wasAd || isCurrentAd) {
      const transitionType = `${wasAd ? "ad" : "video"}_to_${isCurrentAd ? "ad" : "video"}`;
      const context = {};
      if (videoData.credentialTransferToken) {
        context.cttAuthInfo = {
          token: videoData.credentialTransferToken,
          videoId: videoData.videoId
        };
      }
      context.startTime = correctedWallTime - qoe.glassToGlassLatency;
      reportTransition(transitionType, context); // was: qp(T, r)
      reportCSITiming("pbs", correctedWallTime, transitionType);
    }

    qoe.reportEvent("gllat", {
      l: qoe.glassToGlassLatency.toFixed(),
      prev_ad: +wasAd
    });
    delete qoe.lastTransition; // was: delete Q.O
  }
}

/**
 * Logs buffer health ("bh") as a QoE metric.
 * [was: ko]
 *
 * @param {object} qoe - QoE state [was: Q]
 * @param {number} mediaTime - Media time [was: c]
 * @param {object} stats - Aggregated stats [was: W]
 */
export function logBufferHealth(qoe, mediaTime, stats) { // was: ko
  if (!isNaN(stats.bufferHealth)) { // was: W.qH
    let bufferHealth = stats.bufferHealth; // was: m = W.qH
    if (stats.bytesReceived < bufferHealth) {
      bufferHealth = stats.bytesReceived; // was: m = W.O
    }
    logQoeMetric(qoe, mediaTime, "bh", [bufferHealth.toFixed(3)]);
  }
}

/**
 * Periodic stats flush: bandwidth measurements, memory info, battery status,
 * connection type, visibility state, and buffer health.
 * [was: p$]
 *
 * @param {object} qoe - QoE state [was: Q]
 * @param {number} [mediaTime=NaN] - Override media time [was: c]
 */
export function flushPeriodicStats(qoe, mediaTime = NaN) { // was: p$
  const time = mediaTime >= 0 ? mediaTime : getProviderTime(qoe.provider); // was: g.Yo(Q.provider)
  const stats = qoe.provider.playerController.getAggregatedStats(); // was: W = Q.provider.EH.AU()

  // Bandwidth measurements
  const bytesDelta = stats.bytesReceived - (qoe.lastBytesReceived || 0); // was: m = W.Ry - (Q.jG || 0)
  if (bytesDelta > 0) {
    logQoeMetric(qoe, time, "bwm", [
      bytesDelta,
      (stats.totalDownloadTime - (qoe.lastDownloadTime || 0)).toFixed(3)
    ]);
  }

  if (isNaN(qoe.lastBytesReceived) && stats.bytesReceived && qoe.isOffline) {
    qoe.setOnline(false); // was: Q.bf(!1)
  }
  qoe.lastBytesReceived = stats.bytesReceived; // was: Q.jG = W.Ry
  qoe.lastDownloadTime = stats.totalDownloadTime; // was: Q.sC = W.f7

  // Bandwidth estimate
  if (!isNaN(stats.bandwidthEstimate)) {
    logQoeMetric(qoe, time, "bwe", [stats.bandwidthEstimate.toFixed(0)]);
  }

  // Memory info
  if (qoe.provider.featureFlags.isInternalBuild() || // was: Q.provider.FI.cB()
      qoe.provider.featureFlags.isEnabled("html5_log_meminfo")) {
    const memInfo = getMemoryInfo(); // was: qIO()
    if (Object.values(memInfo).some(v => v !== undefined)) {
      qoe.reportEvent("meminfo", memInfo);
    }
  }

  // Battery status
  if (qoe.batteryStatus) { // was: Q.L
    logQoeMetric(qoe, time, "bat", [
      qoe.batteryStatus.level,
      qoe.batteryStatus.charging ? "1" : "0"
    ]);
  }

  // Visibility state changes
  const visState = qoe.provider.playerController.getVisibilityState(); // was: m = Q.provider.EH.getVisibilityState()
  if (qoe.lastVisibilityState !== visState) { // was: Q.Xw !== m
    logQoeMetric(qoe, time, "vis", [visState]);
    qoe.lastVisibilityState = visState;
  }

  recordCurrentMediaTime(qoe, time);

  // Connection type changes
  const connectionType = getEffectiveConnectionType(qoe.provider); // was: m = JY7(Q.provider)
  if (connectionType && connectionType !== qoe.lastConnectionType) { // was: Q.iX
    logQoeMetric(qoe, time, "conn", [connectionType]);
    qoe.lastConnectionType = connectionType;
  }

  logBufferHealth(qoe, time, stats);
}

// ---------------------------------------------------------------------------
// Buffer health check for readahead / request gating
// ---------------------------------------------------------------------------

/**
 * Checks whether enough media is buffered before starting playback.
 * Considers separate audio/video readahead targets, buffer timelines,
 * and SABR (Server ABR) readahead data.
 * [was: MQO]
 *
 * @param {object} sabrState - SABR request state [was: Q]
 * @returns {boolean} True if a new request should be created
 */
export function shouldCreateSabrRequest(sabrState) { // was: MQO
  // Rate limiting check
  if (!checkRateLimit(sabrState, sabrState.rateLimitState)) { // was: hpm(Q, Q.S)
    setBlockReason(sabrState, "ratelimited"); // was: Oe(Q, "ratelimited")
    return false;
  }

  // End-of-stream check
  if (isTrackComplete(sabrState.audioTrack) &&
      isTrackComplete(sabrState.videoTrack)) {
    setBlockReason(sabrState, "endofstream");
    return false;
  }

  // Compute readahead targets
  const audioReadaheadMs = Math.min(
    computeReadaheadLimit(sabrState.loader, sabrState.audioTrack) * 1000,
    sabrState.targetPolicy.targetAudioReadaheadMs
  ); // was: c
  const videoReadaheadMs = Math.min(
    computeReadaheadLimit(sabrState.loader, sabrState.videoTrack) * 1000,
    sabrState.targetPolicy.targetVideoReadaheadMs
  ); // was: m
  const minReadaheadMs = Math.min(audioReadaheadMs, videoReadaheadMs); // was: K

  const currentTimeMs = sabrState.playerController.getCurrentTime() * 1000; // was: T

  // Compute actual buffered readahead
  const { audioReadahead, videoReadahead, audioBufferHealth, videoBufferHealth } =
    computeReadaheadStatus(sabrState, currentTimeMs); // was: zpy(Q, T)

  let needsAudio = audioReadahead < minReadaheadMs; // was: W
  let needsVideo = videoReadahead < minReadaheadMs; // was: A

  // Check SABR cookie-based readahead
  let needsCookie = false; // was: e
  if (hasSabrCookieReadahead(sabrState)) {
    const cookieReadahead = computeCookieReadahead(sabrState.cookieData, currentTimeMs); // was: T = Pe(Q.K, T)
    needsCookie = cookieReadahead < minReadaheadMs;
  }

  if (!(needsAudio || needsVideo || (hasSabrCookieReadahead(sabrState) && needsCookie))) {
    setBlockReason(sabrState, "readaheadmet");
    return false;
  }

  // Short-form / VOD buffered-to-end checks
  if (sabrState.policy.stopRequestWhenBufferedToEndShorts &&
      isBufferedToEnd(sabrState.loader) && sabrState.videoData.isShort()) {
    setBlockReason(sabrState, "shortsbufferedtoend");
    return false;
  }

  if (sabrState.policy.stopRequestWhenBufferedToEndVod &&
      isBufferedToEnd(sabrState.loader)) {
    setBlockReason(sabrState, "vodbufferedtoend");
    return false;
  }

  // Log the request creation reason
  const debugInfo = sabrState.loader.getDebugInfo(); // was: e = Q.loader.wA()
  debugInfo.car = audioReadahead;
  debugInfo.vac = videoReadahead;
  debugInfo.mar = audioReadaheadMs;
  debugInfo.mvr = videoReadaheadMs;
  debugInfo.abh = audioBufferHealth;
  debugInfo.vbh = videoBufferHealth;
  setRequestCreated(sabrState, debugInfo); // was: Gt(Q, e)
  return true;
}

// ---------------------------------------------------------------------------
// Buffer underrun detection
// ---------------------------------------------------------------------------

/**
 * Computes the effective start time for the SABR request, accounting for
 * buffer underruns by finding the closest buffered range end if the
 * current time falls in a gap.
 * [was: kg7]
 *
 * @param {object} sabrState - SABR state [was: Q]
 * @param {number} currentTime - Current playback time [was: c]
 * @returns {number} Adjusted start time
 */
export function getEffectiveStartTime(sabrState, currentTime) { // was: kg7
  if (sabrState.loader.isSeeking()) return currentTime;

  const mediaSource = sabrState.playerController.getMediaSource(); // was: W = Q.EH.Yx()
  if (!mediaSource) return currentTime;

  const buffered = mediaSource.getSourceBufferRanges(); // was: W = W.pU()
  if (buffered.length === 0 || isTimeInRange(buffered, currentTime)) {
    return currentTime;
  }

  // Not in any buffered range — check if tracks have data at this time
  if (!sabrState.videoTrack.hasDataAt(currentTime) &&
      !sabrState.audioTrack.hasDataAt(currentTime)) {
    sabrState.loader.reportEvent("sundrn", { b: 0, enumReader: currentTime });
    return currentTime;
  }

  // Find closest buffered range end before current time
  let closestEnd = currentTime;
  let closestGap = Infinity;
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) > currentTime) continue;
    const gap = currentTime - buffered.end(i);
    if (gap < closestGap) {
      closestGap = gap;
      closestEnd = buffered.end(i);
    }
  }

  if (closestEnd !== currentTime) {
    sabrState.loader.reportEvent("sundrn", {
      bre: closestEnd,
      enumReader: currentTime
    });
    // Reject if gap is excessively large
    if (closestGap >= 20) {
      sabrState.loader.handleError("player.exception", {
        reason: "bufferunderrunexceedslimit"
      });
      return currentTime;
    }
  }

  return closestEnd;
}

// ---------------------------------------------------------------------------
// Live buffer health / latency tracking
// ---------------------------------------------------------------------------

/**
 * Updates live playback state: tracks whether the player is at the live head,
 * logs latency metrics, and records timeline seek events.
 * [was: vQW]
 *
 * @param {object} timeline - Timeline controller [was: Q]
 * @param {boolean} isPlaying - Whether playback is active [was: c]
 */
export function updateLiveBufferState(timeline, isPlaying) { // was: vQW
  const currentTime = timeline.getCurrentTime(); // was: W = Q.getCurrentTime()
  const isAtLiveHead = timeline.isAtLiveHead(currentTime); // was: m = Q.isAtLiveHead(W)

  // Update live ingestion time tracker
  if (timeline.ingestionTracker && isAtLiveHead) { // was: Q.L && m
    const tracker = timeline.ingestionTracker; // was: K = Q.L
    if (tracker.index && !(currentTime >= tracker.rangeStart && currentTime < tracker.rangeEnd)) {
      const segIdx = tracker.index.findSegment(currentTime); // was: T = K.W.zf(W)
      if (segIdx !== -1) {
        tracker.rangeStart = tracker.index.getStartTime(segIdx);
        tracker.rangeEnd = tracker.rangeStart + tracker.index.getDuration(segIdx);
        const wallOffset = performance.now() / 1000 - tracker.index.getIngestionTime(segIdx);
        const corrected = wallOffset - tracker.getClockOffset();
        tracker.latencySamples.add(corrected); // was: K.j.add(T)
      }
    }
  }

  // Update live readahead policy and seek-to-live
  if (timeline.liveReadaheadPolicy) { // was: Q.W
    if (isAtLiveHead) {
      const livePolicy = timeline.liveReadaheadPolicy; // was: K = Q.W
      const bufferLevel = getExternalBufferLevel(timeline); // was: T = xB(Q)
      livePolicy.sampleCount++; // was: K.rJ++
      if (livePolicy.sampleCount >= 3 &&
          Date.now() - livePolicy.lastSampleTime >= 3000) {
        livePolicy.lastSampleTime = Date.now();
        livePolicy.bufferSamples.push(bufferLevel); // was: K.O.push(T)
        if (livePolicy.bufferSamples.length > 50) {
          livePolicy.bufferSamples.shift();
        }
      }
    }
    updateLiveLatency(timeline.liveReadaheadPolicy, currentTime, isPlaying); // was: Zly(Q.W, W, c)
    if (isPlaying) {
      seekToLiveIfNeeded(timeline, true); // was: sI_(Q, !0)
    }
  }

  // Log live head transitions
  if (isAtLiveHead !== timeline.wasAtLiveHead) { // was: m !== Q.iX
    const recentSeek = timeline.getCurrentTime() - timeline.lastSeekTime <= 500;
    const tooManyTransitions = timeline.liveHeadTransitionCount >= 1000;
    if (!recentSeek && !tooManyTransitions) {
      // Report live head change to QoE
      const qoe = timeline.playerController.qoeReporter;
      if (qoe?.qoe) {
        const qoeState = qoe.qoe;
        const qoeTime = getProviderTime(qoeState.provider);
        logQoeMetric(qoeState, qoeTime, "lh", [isAtLiveHead ? "1" : "0"]);
      }
      timeline.wasAtLiveHead = isAtLiveHead; // was: Q.iX = m
      timeline.liveHeadTransitionCount++; // was: Q.Fw++
      timeline.lastSeekTime = timeline.getCurrentTime(); // was: Q.Re = Q.getCurrentTime()
    }
  }
}

// ---------------------------------------------------------------------------
// Seek timeline / seek resolution
// ---------------------------------------------------------------------------

/**
 * Initiates a seek operation by creating a promise that resolves when
 * the media element has seeked to the target time.
 * [was: qG]
 *
 * @param {object} seekState - Seek state controller [was: Q]
 * @param {object} [seekOptions] - Options (e.g. seekSource) [was: c]
 * @returns {Promise<number>} Resolves with the actual seeked time
 */
export function initiateSeek(seekState, seekOptions) { // was: qG
  let seekPromise = seekState.seekPromise; // was: W = Q.j
  if (!seekPromise) {
    seekState.seekPromise = new DeferredPromise(); // was: Q.j = new g8
    seekPromise = seekState.seekPromise;
    performSeek(seekState, seekOptions); // was: Iq(Q, c)
  }
  return seekPromise;
}

/**
 * Performs the actual seek on the media element, handling edge cases like
 * live playback, end-of-stream clamping, and native seeking thresholds.
 * [was: Iq]
 *
 * @param {object} seekState - Seek state controller [was: Q]
 * @param {object} [seekOptions] - Seek options [was: c]
 */
export function performSeek(seekState, seekOptions) { // was: Iq
  if (!seekState.seekPromise) return;

  // Update live segment if this is a live seek
  if (seekState.videoData.isLivePlayback && seekState.videoData.streamingData &&
      !seekState.videoData.streamingData.isIndexLoaded() &&
      seekState.mediaElement && seekState.mediaElement.readyState() > 0 &&
      getBufferedDuration(seekState.mediaElement) > 0) {
    seekState.targetTime = clampToSeekableRange(
      seekState, seekState.targetTime, false
    ); // was: Q.O = Ub(Q, Q.O, !1)
  }

  // Check if we can skip pseudogapless seek
  const skipPseudoGapless = seekState.isEnabled("html5_pseudogapless_shorts_seek_to_next_start") &&
    seekOptions?.seekSource === 60;

  if (!seekState.mediaElement || !isMediaReadyForSeek(seekState, skipPseudoGapless)) {
    seekState.retryTimer.start(750); // was: Q.WB.start(750)
    return;
  }

  // Verify target is valid
  if (isNaN(seekState.targetTime) || !isFinite(seekState.targetTime)) return;

  // Check if we are already close enough
  const currentDelta = seekState.mediaElement.getCurrentTime() - seekState.targetTime;
  if (Math.abs(currentDelta) <= seekState.seekThreshold || Math.abs(currentDelta) < 0.005) {
    resolveSeek(seekState); // was: Ljd(Q)
    return;
  }

  // Handle seeking past end of stream
  if (!isLiveOrDVR(seekState.videoData) &&
      seekState.targetTime >= seekState.getMaxSeekableTime() - 0.1) {
    seekState.targetTime = seekState.getMaxSeekableTime();
    seekState.seekPromise.resolve(seekState.getMaxSeekableTime());
    seekState.playerController.signalEnded(); // was: Q.EH.Sn()
    return;
  }

  // Execute the seek
  try {
    const adjustedTarget = seekState.targetTime - seekState.timestampOffset;
    seekState.mediaElement.seekTo(adjustedTarget);
    seekState.seekMonitor.lastSeekTarget = adjustedTarget; // was: Q.mF.W = W
    seekState.lastNativeTarget = adjustedTarget; // was: Q.PA = W
    seekState.confirmedTarget = seekState.targetTime; // was: Q.A = Q.O
    seekState.isNativeSeek = false; // was: Q.S = !1
  } catch (e) {
    // Silently handle seek errors (e.g. detached media element)
  }
}

/**
 * Resolves a pending seek when the media element fires "seeked".
 * [was: Ljd]
 *
 * @param {object} seekState - Seek state controller [was: Q]
 */
export function resolveSeek(seekState) { // was: Ljd
  if (seekState.seekPromise) {
    seekState.seekPromise.resolve(seekState.mediaElement.getCurrentTime());
    seekState.seekMonitor.pendingSeek = null; // was: Q.mF.O = null
  }
}

/**
 * Clears all seek-related state after a seek completes or is cancelled.
 * [was: Vk]
 *
 * @param {object} seekState - Seek state controller [was: Q]
 */
export function clearSeekState(seekState) { // was: Vk
  seekState.targetTime = NaN; // was: Q.O = NaN
  seekState.seekOriginTime = NaN; // was: Q.D = NaN
  seekState.lastNativeTarget = NaN; // was: Q.PA = NaN
  seekState.seekPromise = null; // was: Q.j = null
  seekState.loaderSeekPromise = null; // was: Q.b0 = null
  seekState.seekResolvePromise = null; // was: Q.K = null
  seekState.isInSeek = false; // was: Q.Ie = !1
  seekState.isNativeSeek = false; // was: Q.S = !1
  seekState.seekThreshold = 0; // was: Q.UH = 0
  seekState.inBufferSeekTimer.stop(); // was: Q.MM.stop()
  seekState.seekTimeoutTimer.stop(); // was: Q.XI.stop()
}

// ---------------------------------------------------------------------------
// Seek clamping
// ---------------------------------------------------------------------------

/**
 * Clamps a seek target to the valid seekable range, logging out-of-bounds attempts.
 * [was: Ub]
 *
 * @param {object} seekState - Seek state controller [was: Q]
 * @param {number} target - Desired seek time [was: c]
 * @param {boolean} allowLiveExtension - Whether to allow seeking beyond DVR window [was: W]
 * @returns {number} Clamped seek time
 */
export function clampToSeekableRange(seekState, target, allowLiveExtension) { // was: Ub
  if (isNaN(target)) return NaN;
  const minSeekable = seekState.getMinSeekableTime(); // was: m = Q.bC()
  const maxSeekable = seekState.getMaxSeekableTime(allowLiveExtension); // was: W = Q.TU(W)

  if (seekState.isEnabled("html5_clamp_invalid_seek_to_min_seekable_time") &&
      !seekState.videoData.isLivePlayback && target > maxSeekable + 1 && target < Infinity) {
    if (seekState.featureFlags.isInternalBuild()) {
      seekState.playerController.reportEvent("clampInvalidSeek", {
        tgt: `${target}`,
        maxst: `${maxSeekable}`
      });
    }
    return minSeekable;
  }

  return clamp(target, minSeekable, maxSeekable); // was: g.lm(c, m, W)
}
