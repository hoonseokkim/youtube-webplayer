/**
 * Ad Prebuffer — gapless transition management, video queueing,
 * bandwidth estimation, segment timeline tracking, and SSDAI
 * prebuffer state for ad playback.
 *
 * Deobfuscated from YouTube's base.js (player_es6.vflset/en_US).
 *   Source lines: 52545–53734
 *
 * Key subsystems:
 *   - Gapless transition state machine (QH, OYn, vmy, fzW, WZ)
 *     Manages MSE source-buffer hand-off between current and next playback.
 *   - Video queuer (GNK, Kt, mz, $2y, lz7, zn7, C2R)
 *     Queues up the next video for gapless playback, with cue-range triggers.
 *   - Player visibility check (iDm) — not minimized/inline/background/PiP.
 *   - Expiring data list (oh, re, uLx, Tx) — time-based eviction cache.
 *   - Playback presenter management (MY_, UD, Ih)
 *     Multi-player presenter coordination and lifecycle events.
 *   - Player config initialization (kNn, nZK) — experiment flags, Cobalt tweaks.
 *   - Bandwidth estimation (U6, X0, x$, DY0, $50, qm, F0, nt, DC, CE, BZ, t8K, NHW)
 *     Weighted bandwidth estimator with interrupt tracking.
 *   - Segment miss helpers (iI7, yW_, Snn, FIR, ZI3, EZn, s10)
 *     Ad playback timeline segment tracking and lookup.
 *   - SSDAI prebuffer cueing (pEW, g.wqw, pE, wvK, ZC, bId, ED, HZ, gZ0, f$0, sD, vZ_, de, we)
 *     (Some of these are also in ad-cue-delivery.js — this file covers the
 *      prebuffer-specific paths and helpers not already deobfuscated.)
 *   - Obfuscated dispatch (jb) — XOR-indexed array dispatch.
 *   - Ad break decoration (COn, M8O, JWX, RtK, $Yn, a$X, PO7, kwO)
 *
 * [was: QH, gmx, OYn, vmy, fzW, WZ, GNK, Kt, mz, $2y, lz7, zn7, C2R,
 *  iDm, oh, re, uLx, Tx, MY_, UD, Ih, kNn, nZK, U6, X0, x$, DY0,
 *  $50, qm, F0, nt, DC, CE, BZ, t8K, NHW, iI7, yW_, Snn, FIR, ZI3,
 *  EZn, s10, pEW, g.wqw, pE, wvK, ZC, bId, ED, HZ, gZ0, f$0, sD,
 *  vZ_, de, we, Gwd, bM, Lt, l$d, Fb, ge, hty, uZ7, j1, g.iM, S1,
 *  dY_, OD, Nm, LIW, yH, jb, COn, M8O, JWX, RtK, $Yn, a$X, PO7, kwO]
 */

import { forEach } from '../core/event-registration.js';  // was: g.mfm
import { defineProperty } from '../core/polyfills.js';  // was: g.QW_
import { MediaElementView } from '../features/shorts-player.js';  // was: g.cZ
import { playVideo, seekTo, stopVideo } from '../player/player-events.js';  // was: g.playVideo, g.seekTo, g.stopVideo
import { cueRangeStartId } from './ad-scheduling.js';  // was: g.Sr
import { isMediaSourceOpen } from '../media/codec-helpers.js'; // was: Qv
import { getMediaSource } from '../player/context-updates.js'; // was: pK()
import { INJECTION_DEPS } from '../network/innertube-config.js'; // was: Du
import { getMetricValues } from '../core/event-system.js'; // was: Ps
import { getOwnerDocument } from '../player/video-loader.js'; // was: V4
import { UnscheduledSlotTrigger } from './ad-trigger-types.js'; // was: yZ
import { truncateValue } from '../data/gel-params.js'; // was: FY
import { getPersistedQuality } from './ad-async.js'; // was: XU
import { isGaplessShortEligible } from '../media/seek-controller.js'; // was: wA
import { ElementGeometryObserver } from '../data/module-init.js'; // was: et
import { RetryTimer } from '../media/grpc-parser.js'; // was: tJ
import { getAdHandlerContext } from '../player/playback-bridge.js'; // was: mQ
import { shouldUseSabr } from '../media/seek-controller.js'; // was: M8
import { renderAudioVisualiser } from '../player/video-loader.js'; // was: q2
import { tryThenableResolve } from '../core/composition-helpers.js'; // was: WJ
import { readFloat } from '../media/format-parser.js'; // was: V9
import { timedInvoke } from '../core/event-registration.js'; // was: pO
import { getNextSegmentStart } from './ad-async.js'; // was: OpX
import { isCompressedDomainComposite } from '../media/audio-normalization.js'; // was: gA
import { getQoeTimestamp } from '../player/time-tracking.js'; // was: jM()
import { GaplessTransition } from '../features/shorts-player.js'; // was: P27
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { MetricCondition } from '../data/module-init.js'; // was: X_
import { getVideoId } from '../player/time-tracking.js'; // was: MY()
import { writeVarintField } from '../proto/varint-decoder.js'; // was: Zq
import { setShadowRootDocumentMode } from '../player/video-loader.js'; // was: hY3
import { ensureCpuUsageTrackerIntervals } from '../media/engine-config.js'; // was: zFy
import { setBandwidthCookieMaxAge } from './ad-async.js'; // was: zMx
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { persistBandwidth } from './ad-async.js'; // was: CE_
import { EXP_748402147 } from '../proto/messages-core.js'; // was: Hw
import { reportTelemetry } from './dai-cue-range.js'; // was: PB
import { applyQualityConstraint } from '../media/quality-constraints.js'; // was: d3
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { clientHintsOverride } from '../proto/messages-core.js'; // was: Sf
import { rejectedPromise } from '../core/composition-helpers.js'; // was: cJ
import { mainVideoEntityActionMetadataKey } from '../modules/offline/entity-sync.js'; // was: QE
import { stepGenerator } from './ad-async.js'; // was: GH
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { getCurrentTime, getDuration } from '../player/time-tracking.js';
import { dispose } from './dai-cue-range.js';
import { CueRange } from '../ui/cue-range.js';
import { filter, clear, splice, sortedInsert, binarySearch } from '../core/array-utils.js';
// TODO: resolve g.h
// TODO: resolve g.iD
// TODO: resolve g.mN

// ---------------------------------------------------------------------------
// Gapless transition status  (line 52546)
// ---------------------------------------------------------------------------

/**
 * Advances the gapless transition status to `newStatus` if it is higher
 * than the current status. Resolves the completion promise at status 5.
 *
 * @param {Object} transition  Gapless transition object.  [was: Q]
 * @param {number} newStatus   Target status value.        [was: c]
 *
 * [was: QH]
 */
export function advanceTransitionStatus(transition, newStatus) { // was: QH
  if (newStatus <= transition.status.status) return;
  transition.status = { status: newStatus, error: null };
  if (newStatus === 5) transition.Wn.resolve();
}

/**
 * Creates a media element view wrapper for gapless playback.
 *
 * @param {Object} source        Media element or view.  [was: Q]
 * @param {number} startTime     Start time in seconds.  [was: c]
 * @param {number} endTime       End time in seconds.    [was: W]
 * @param {boolean} isNotAd      Whether this is non-ad content. [was: m]
 * @returns {Object}             New media element view (cZ instance).
 *
 * [was: gmx]
 */
export function createMediaElementView(source, startTime, endTime, isNotAd) { // was: gmx
  source = source.isView() ? source.mediaElement : source;
  return new MediaElementView(source, startTime, endTime, isNotAd);
}

// ---------------------------------------------------------------------------
// Gapless transition finalization  (line 52559)
// ---------------------------------------------------------------------------

/**
 * Completes the gapless transition: waits for readiness, transfers the
 * media element to the next playback mode, and publishes timing telemetry.
 *
 * @param {Object} transition  Gapless transition object.  [was: Q]
 * @returns {Promise}
 *
 * [was: OYn]
 */
export async function finishGaplessTransition(transition) { // was: OYn
  if (transition.u0()) {
    return Promise.reject(Error(transition.status.error || "disposed"));
  }
  transition.timeout.start();
  await transition.Wn;

  let mediaElement = transition.W.Yx(); // was: c
  if (mediaElement.isEnded()) {
    transition.bl("ended_in_finishTransition");
    return Promise.reject(Error(transition.status.error || ""));
  }
  if (!transition.K || !isMediaSourceOpen(transition.K)) {
    transition.bl("next_mse_closed");
    return Promise.reject(Error(transition.status.error || ""));
  }
  if (transition.O.getMediaSource !== transition.K) {
    transition.bl("next_mse_mismatch");
    return Promise.reject(Error(transition.status.error || ""));
  }

  const { t5: startTime, RK: resumeTime, INJECTION_DEPS: endTime } = transition.L(); // was: W, m, K
  transition.W.getMetricValues(false, true); // was: !1, !0
  const view = createMediaElementView(mediaElement, startTime, endTime, !transition.O.getVideoData().isAd()); // was: T
  transition.O.setMediaElement(view);

  const formatInfo = transition.W.getOwnerDocument(); // was: r
  if (formatInfo) transition.O.truncateValue(formatInfo.UnscheduledSlotTrigger, formatInfo.Pl);

  if (transition.Ie) {
    if (transition.policy.W) {
      // Policy says no pseudo-seek
    } else {
      transition.O.seekTo(transition.O.getCurrentTime() + 0.001, {
        Qo: true, getPersistedQuality: 3, Z7: "gapless_pseudo" // was: !0
      });
    }
    view.play();
  }

  // Publish telemetry
  mediaElement = mediaElement.isGaplessShortEligible();
  mediaElement.cpn = transition.W.getVideoData().clientPlaybackNonce;
  mediaElement.st = `${startTime}`;
  mediaElement.ElementGeometryObserver = `${endTime}`;
  transition.O.RetryTimer("gapless", mediaElement);
  transition.W.RetryTimer("gaplessTo", { cpn: transition.O.getVideoData().clientPlaybackNonce });

  const sameType = transition.W.getPlayerType() === transition.O.getPlayerType(); // was: c (reused)
  transition.W.getAdHandlerContext(resumeTime, true, false, sameType, transition.O.getVideoData().clientPlaybackNonce); // was: !0, !1
  transition.O.getAdHandlerContext(transition.O.getCurrentTime(), true, true, sameType, transition.W.getVideoData().clientPlaybackNonce);
  transition.O.Py();

  g.mN(() => {
    if (!transition.O.getVideoData().L && transition.O.getPlayerState().isOrWillBePlaying()) {
      transition.O.QU();
    }
  });

  advanceTransitionStatus(transition, 6);
  transition.dispose();
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Gapless MSE setup  (line 52607)
// ---------------------------------------------------------------------------

/**
 * Attaches the next playback mode to the shared MediaSource, subscribes
 * to source-buffer update events, and triggers initial data transfer.
 *
 * @param {Object} transition  Gapless transition object.  [was: Q]
 *
 * [was: vmy]
 */
export function attachNextToMediaSource(transition) { // was: vmy
  if (!transition.O.getVideoData().A) return;
  const suspendNext = transition.sO.G().X("html5_gapless_suspend_next_loader") && transition.D === 1; // was: c
  transition.O.GW(transition.K, suspendNext, transition.D === 1 && shouldUseSabr(transition.W.getVideoData()));
  advanceTransitionStatus(transition, 3);
  unsubscribeTransitionEvents(transition); // was: fzW

  const { renderAudioVisualiser: videoBuffer, n9: audioBuffer } = getSourceBuffers(transition); // was: W, m
  videoBuffer.subscribe("updateend", transition.J, transition);
  audioBuffer.subscribe("updateend", transition.J, transition);
  transition.J(videoBuffer);
  transition.J(audioBuffer);
}

/**
 * Unsubscribes from all transition-related events on both playback modes.
 *
 * @param {Object} transition  Gapless transition object.  [was: Q]
 *
 * [was: fzW]
 */
export function unsubscribeTransitionEvents(transition) { // was: fzW
  transition.W.unsubscribe("internalvideodatachange", transition.A, transition);
  transition.O.unsubscribe("internalvideodatachange", transition.A, transition);
  if (transition.sO.G().X("html5_gapless_use_format_info_fix")) {
    transition.W.unsubscribe("internalvideoformatchange", transition.A, transition);
    transition.O.unsubscribe("internalvideoformatchange", transition.A, transition);
  }
  transition.W.unsubscribe("mediasourceattached", transition.A, transition);
  transition.O.unsubscribe("statechange", transition.S, transition);
}

/**
 * Returns the video and audio source buffer wrappers from the transition.
 *
 * @param {Object} transition  Gapless transition object.  [was: Q]
 * @returns {{q2: Object, n9: Object}}
 *
 * [was: WZ]
 */
export function getSourceBuffers(transition) { // was: WZ
  return {
    renderAudioVisualiser: transition.j.W.tryThenableResolve,
    n9: transition.j.O.tryThenableResolve
  };
}

// ---------------------------------------------------------------------------
// Video queuer — start queued playback  (line 52637)
// ---------------------------------------------------------------------------

/**
 * Initiates playback of the queued next video, resolving the gapless
 * transition or falling back to standard playback on failure.
 *
 * @param {Object} queuer  Video queuer instance.  [was: Q]
 *
 * [was: GNK]
 */
export async function startQueuedPlayback(queuer) { // was: GNK
  if (queuer.u0() || !queuer.j || !queuer.W) return;

  if (queuer.mF) queuer.app.oe().Sn(true, false); // was: !0, !1

  let transitionError = null; // was: c
  if (queuer.A) {
    try {
      await finishGaplessTransition(queuer.A);
    } catch (err) {
      transitionError = err;
    }
  }

  if (queuer.W) {
    azW.readFloat("vqsp", () => { queuer.app.LA(queuer.W); });
    if (queuer.W) {
      const mediaEl = queuer.W.Yx(); // was: W
      if (queuer.app.G().X("html5_gapless_seek_on_negative_time") && mediaEl && mediaEl.getCurrentTime() < -0.01) {
        queuer.W.seekTo(0);
      }
      azW.readFloat("vqpv", () => { queuer.app.playVideo(); });

      if (transitionError) {
        if (queuer.W) {
          const reason = transitionError ? transitionError.message : "forced"; // was: c (reused)
          queuer.O?.RetryTimer("gapfulfbk", { r: reason });
          queuer.W.Ra(reason);
        } else {
          queuer.O?.RetryTimer("gapsp", {});
        }
      }

      const deferred = queuer.j; // was: c (reused)
      clearQueuer(queuer); // was: mz
      if (deferred) deferred.resolve();
      Promise.resolve();
    }
  }
}

/**
 * Removes the timeupdate listener used for prebuffer timing.
 *
 * @param {Object} queuer  Video queuer instance.  [was: Q]
 *
 * [was: Kt]
 */
export function removeTimeupdateListener(queuer) { // was: Kt
  if (queuer.Y && queuer.D) {
    queuer.Y.removeEventListener("timeupdate", queuer.D);
  }
  queuer.D = null;
  queuer.Y = null;
}

/**
 * Clears the queuer state, canceling any pending transition and optionally
 * disposing the queued playback mode.
 *
 * @param {Object}  queuer        Video queuer instance.           [was: Q]
 * @param {boolean} [keepAlive=false] If true, keep the queued mode alive. [was: c]
 *
 * [was: mz]
 */
export function clearQueuer(queuer, keepAlive = false) { // was: mz  // was: !1
  if (queuer.O) {
    if (queuer.J) {
      const playback = queuer.O; // was: W
      queuer.app.ge.removeEventListener(cueRangeStartId("vqueued"), queuer.L);
      playback.removeCueRange(queuer.J);
    }
    queuer.O = null;
    queuer.J = null;
  }
  if (queuer.A) {
    if (queuer.A.status.status !== 6) {
      const t = queuer.A; // was: W (reused)
      if (t.status.status !== Infinity && t.D !== 1) t.bl("Canceled");
    }
    queuer.A = null;
  }
  queuer.j = null;
  if (queuer.W && !keepAlive && queuer.W !== queuer.app.timedInvoke() && queuer.W !== queuer.app.oe()) {
    queuer.W.dispose();
  }
  if (queuer.W && keepAlive) queuer.W.VH();
  queuer.W = null;
  queuer.mF = false; // was: !1
}

// ---------------------------------------------------------------------------
// Video queuer — set cue range trigger  (line 52697)
// ---------------------------------------------------------------------------

/**
 * Sets up a cue-range trigger on the current playback so the queued
 * video starts at the right time.
 *
 * @param {Object}  queuer     Video queuer instance.                [was: Q]
 * @param {number}  triggerMs  Trigger time in milliseconds.         [was: c]
 * @param {boolean} [useCueRange=true] Whether to use a cue-range.  [was: W]
 *
 * [was: $2y]
 */
export function setQueueTrigger(queuer, triggerMs, useCueRange = true) { // was: $2y
  const playback = queuer.app.oe(); // was: m
  const maxMs = playback.getVideoData().isLivePlayback ? Infinity : playback.qE(true) * 1000; // was: K  // was: !0, 1E3
  if (triggerMs > maxMs) {
    triggerMs = maxMs - 200;
    queuer.mF = true;
  }
  if (useCueRange && playback.getCurrentTime() >= triggerMs / 1000) {
    queuer.L();
  } else {
    queuer.O = playback;
    if (useCueRange) {
      queuer.app.ge.addEventListener(cueRangeStartId("vqueued"), queuer.L);
      const cueEnd = isFinite(triggerMs) || triggerMs / 1000 > playback.getDuration()
        ? triggerMs : 0x8000000000000;
      queuer.J = new CueRange(cueEnd, 0x8000000000000, { namespace: "vqueued" });
      playback.addCueRange(queuer.J);
    }
  }
}

// ---------------------------------------------------------------------------
// Video queuer — queue next video  (line 52713)
// ---------------------------------------------------------------------------

/**
 * Queues the next video for gapless playback, setting up the transition
 * object and cue-range trigger.
 *
 * @param {Object} queuer         Video queuer instance.                [was: Q]
 * @param {Object} nextPlayback   The next playback mode to queue.      [was: c]
 * @param {number} triggerMs      Trigger time in milliseconds.         [was: W]
 * @param {number} [startMs=0]    Start time offset in ms for the next video. [was: m]
 * @param {number} [mode=0]       Gapless mode (0=standard, 1=suspend). [was: K]
 * @returns {Object}              Deferred promise for completion.
 *
 * [was: lz7]
 */
export function queueNextVideo(queuer, nextPlayback, triggerMs, startMs = 0, mode = 0) { // was: lz7
  if (!queuer.Zr()) {
    removeTimeupdateListener(queuer);
    clearQueuer(queuer);
  }
  queuer.j = new g8;
  queuer.W = nextPlayback;
  setQueueTrigger(queuer, triggerMs, mode === 0);

  let alignedStart = startMs /= 1000; // was: T  // was: 1E3
  const formatData = nextPlayback.getVideoData().W; // was: r
  if (startMs && formatData && queuer.O) {
    let targetStart = startMs; // was: U
    let remainder = 0; // was: I
    if (nextPlayback.getVideoData().isLivePlayback) {
      alignedStart = Math.min(triggerMs / 1000, queuer.O.qE(true)); // was: T (reused)  // was: !0
      remainder = Math.max(0, alignedStart - queuer.O.getCurrentTime());
      targetStart = Math.min(startMs, nextPlayback.qE() + remainder);
    }
    alignedStart = getNextSegmentStart(formatData, targetStart) || startMs;
    if (alignedStart !== startMs) {
      queuer.W.RetryTimer("qvaln", { st: startMs, at: alignedStart, rm: remainder, ct: targetStart });
    }
  }

  const queuedPlayback = queuer.W; // was: c (reused), m (reused)
  queuedPlayback.getVideoData().isCompressedDomainComposite = true; // was: !0
  queuedPlayback.getVideoData().J = true;
  queuedPlayback.oy(true);

  let telemetry = {}; // was: r (reused)
  if (queuer.O) {
    telemetry = queuer.O.getQoeTimestamp;
    const cpn = queuer.O.getVideoData().clientPlaybackNonce; // was: T (reused)
    telemetry = { crt: (telemetry * 1000).toFixed(), cpn }; // was: 1E3
  }
  queuedPlayback.RetryTimer("queued", telemetry);
  if (alignedStart !== 0) {
    queuedPlayback.seekTo(alignedStart + 0.01, { Qo: true, getPersistedQuality: 3, Z7: "videoqueuer_queued" });
  }

  queuer.A = new GaplessTransition(queuer.K, queuer.app.oe(), queuer.W, triggerMs, queuer.app, mode);
  const transition = queuer.A;
  if (transition.status.status !== Infinity) {
    advanceTransitionStatus(transition, 1);
    transition.W.subscribe("internalvideodatachange", transition.A, transition);
    transition.O.subscribe("internalvideodatachange", transition.A, transition);
    if (transition.sO.G().X("html5_gapless_use_format_info_fix")) {
      transition.W.subscribe("internalvideoformatchange", transition.A, transition);
      transition.O.subscribe("internalvideoformatchange", transition.A, transition);
    }
    transition.W.subscribe("mediasourceattached", transition.A, transition);
    transition.O.subscribe("statechange", transition.S, transition);
    transition.W.subscribe("newelementrequired", transition.T2, transition);
    transition.A();
  }
  return queuer.j;
}

// ---------------------------------------------------------------------------
// Prebuffer start timing  (line 52767)
// ---------------------------------------------------------------------------

/**
 * Sets up a timeupdate listener to report the prebuffer-start timestamp
 * once playback reaches the trigger point.
 *
 * @param {Object} queuer        Video queuer instance.  [was: Q]
 * @param {number} triggerTimeSec Trigger time in seconds.  [was: c]
 *
 * [was: zn7]
 */
export function setupPrebufferTiming(queuer, triggerTimeSec) { // was: zn7
  if (!queuer.app.G().getExperimentFlags.W.BA(uBy)) return;
  const windowMs = queuer.app.G().getExperimentFlags.W.BA(hnd); // was: W
  if (windowMs <= 0) return;

  removeTimeupdateListener(queuer);
  const mediaEl = queuer.app.oe()?.Yx(); // was: m
  if (mediaEl && queuer.W) {
    queuer.W.getVideoData().YI = true; // was: !0
    queuer.D = () => {
      const currentTime = mediaEl.getCurrentTime(); // was: K
      if (currentTime >= triggerTimeSec + windowMs / 1000) { // was: 1E3
        const timestamp = Date.now() - (currentTime - triggerTimeSec) * 1000;
        queuer.app.MetricCondition().tick("pbs", timestamp);
        removeTimeupdateListener(queuer);
      }
    };
    queuer.Y = mediaEl;
    mediaEl.addEventListener("timeupdate", queuer.D);
  }
}

// ---------------------------------------------------------------------------
// Queuer readiness check  (line 52787)
// ---------------------------------------------------------------------------

/**
 * Checks whether the queuer is ready to start the queued video, returning
 * a string reason code if not ready, or null if ready.
 *
 * @param {Object} queuer      Video queuer instance.              [was: Q]
 * @param {Object} videoData   Target video data to validate against. [was: c]
 * @param {number} playerType  Presenting player type.               [was: W]
 * @returns {string|null}      Reason code string, or null if ready.
 *
 * [was: C2R]
 */
export function checkQueuerReadiness(queuer, videoData, playerType) { // was: C2R
  if (queuer.Zr()) return "qie";
  if (queuer.W == null || queuer.W.u0() || queuer.W.getVideoData() == null) return "qpd";
  if (videoData.videoId !== queuer.W.getVideoId) return "vinm";
  if ((queuer.A?.mF() || -1) <= 0) return "ivd";
  if (playerType !== 1) return "upt";
  const result = queuer.A?.MM(); // was: Q (reused)
  return result != null ? result : null;
}

// ---------------------------------------------------------------------------
// Player visibility check  (line 52802)
// ---------------------------------------------------------------------------

/**
 * Returns whether the player is in a normal visible state (not minimized,
 * inline, background, PiP, fullscreen overlay, etc.).
 *
 * @param {Object} app  Application instance.  [was: Q]
 * @returns {boolean}
 *
 * [was: iDm]
 */
export function isPlayerInNormalState(app) { // was: iDm
  return !(app.isMinimized() || app.isInline() || app.isBackground()
    || app.Zh() || app.hs() || app.writeVarintField() || app.d7());
}

// ---------------------------------------------------------------------------
// Expiring data list  (line 52806)
// ---------------------------------------------------------------------------

/**
 * Evicts expired entries from the data list based on current time.
 *
 * @param {Object} list  Expiring data list.  [was: Q]
 *
 * [was: oh]
 */
export function evictExpired(list) { // was: oh
  const now = (0, g.h)(); // was: c
  list.data.forEach((entry) => { // was: W
    if (entry.expire < now) onEntryExpired(list, entry, true); // was: Tx  // was: !0
  });
  list.data = filter(list.data, (entry) => !(entry.expire < now));
}

/**
 * Restarts the expiry timer to fire when the next entry expires.
 *
 * @param {Object} list  Expiring data list.  [was: Q]
 *
 * [was: re]
 */
export function restartExpiryTimer(list) { // was: re
  list.W.stop();
  let nextExpiry = Infinity; // was: c
  for (const entry of list.data) {
    if (entry.expire < nextExpiry) nextExpiry = entry.expire;
  }
  if (nextExpiry && isFinite(nextExpiry)) {
    const delay = Math.max(nextExpiry - Date.now(), 100); // was: c (reused)
    list.W.start(delay);
  }
}

/**
 * Returns all non-expired values from the data list.
 *
 * @param {Object} list  Expiring data list.  [was: Q]
 * @returns {Array}
 *
 * [was: uLx]
 */
export function getActiveValues(list) { // was: uLx
  evictExpired(list);
  return list.data.map((entry) => entry.value);
}

/**
 * Called when a data list entry expires; invokes the optional callback.
 *
 * @param {Object}  list       Expiring data list.   [was: Q]
 * @param {Object}  entry      The expired entry.     [was: c]
 * @param {boolean} notify     Whether to call the callback. [was: W]
 *
 * [was: Tx]
 */
export function onEntryExpired(list, entry, notify) { // was: Tx
  if (notify && list.O) list.O(entry.value);
}

// ---------------------------------------------------------------------------
// Playback presenter management  (line 52834)
// ---------------------------------------------------------------------------

/**
 * Clears all secondary playback presenters, disposing them and resetting
 * the presenter map.
 *
 * @param {Object} presenters  Presenter manager.  [was: Q]
 *
 * [was: MY_]
 */
export function clearSecondaryPresenters(presenters) { // was: MY_
  const ended = presenters.W ? [presenters.W] : [];
  for (const p of Object.values(presenters.j)) {
    p.dispose();
    delete presenters.K[p.Sr()];
  }
  presenters.j = {};
  presenters.W = null;
  presenters.J = null;
  presenters.L.clear();
  publishPlaybackChange(presenters, [], ended); // was: UD
}

/**
 * Publishes a `playbackChange` event with active, started, and ended
 * presenter CPN lists.
 *
 * @param {Object} presenters  Presenter manager.  [was: Q]
 * @param {Array}  started     Newly started presenters.  [was: c]
 * @param {Array}  ended       Ended presenters.          [was: W]
 *
 * [was: UD]
 */
export function publishPlaybackChange(presenters, started, ended) { // was: UD
  const active = [presenters.O]; // was: m
  if (presenters.W) active.push(presenters.W);
  presenters.api.publish("playbackChange", {
    active: active.filter((p) => p.getPlayerType() !== 0).map((p) => ({ cpn: p.Sr() })),
    started: started.filter((p) => p.getPlayerType() !== 0).map((p) => ({ cpn: p.Sr() })),
    ended: ended.filter((p) => p.getPlayerType() !== 0).map((p) => ({ cpn: p.Sr() }))
  });
}

/**
 * Registers a new secondary presenter and publishes the change event.
 *
 * @param {Object}  presenters  Presenter manager.       [was: Q]
 * @param {Object}  playback    New playback presenter.  [was: c]
 * @param {boolean} isJoined    Whether it's a joined presenter. [was: W]
 *
 * [was: Ih]
 */
export function registerSecondaryPresenter(presenters, playback, isJoined) { // was: Ih
  const started = [playback]; // was: m
  const ended = presenters.W ? [presenters.W] : []; // was: K
  presenters.j[playback.Sr()] = playback;
  presenters.K[playback.Sr()] = playback;
  presenters.W = playback;
  if (isJoined) presenters.J = playback;
  presenters.L.set("", playback);
  publishPlaybackChange(presenters, started, ended);
}

// ---------------------------------------------------------------------------
// Player config initialization  (line 52873)
// ---------------------------------------------------------------------------

/**
 * Initializes global player configuration flags from experiment settings.
 *
 * @param {Object} config  Player configuration object.  [was: Q]
 *
 * [was: kNn]
 */
export function initPlayerConfigFlags(config) { // was: kNn
  const experiments = config.experiments; // was: c
  const flag = experiments.SG.bind(experiments); // was: W

  Xb = flag("html5_use_async_g.stopVideo");
  JTw = flag("html5_pause_for_async_g.stopVideo");
  AL = flag("html5_not_reset_media_source") || flag("html5_not_reset_media_source_non_drm_vod");
  if (flag("html5_listen_for_audio_output_changed")) EIO = true; // was: !0
  cD = flag("html5_not_reset_media_source") || flag("html5_not_reset_media_source_non_drm_vod");
  Rny = flag("html5_not_reset_media_source") || flag("html5_not_reset_media_source_non_drm_vod");
  e1 = flag("html5_retain_source_buffer_appends_for_debugging");
  setShadowRootDocumentMode(flag("web_watch_pip") || flag("web_shorts_pip"));
  B77(flag("log_foreground_not_focused_as_background"));
  x37(flag("web_player_pip_logging_fix"));
  if (flag("html5_mediastream_applies_timestamp_offset")) yI = true;
  if (config.cB()) ensureCpuUsageTrackerIntervals();

  Error.stackTraceLimit = 50;

  const idleRateLimitMs = getExperimentValue(experiments, "html5_idle_rate_limit_ms"); // was: m
  if (idleRateLimitMs) {
    Object.defineProperty(window, "requestIdleCallback", {
      value: (cb) => window.setTimeout(cb, idleRateLimitMs)
    });
  }

  Iqn(config.K);
  fiw(flag("html5_use_ump_request_slicer"));
  if (flag("html5_disable_streaming_xhr")) em = false; // was: !1
  if (flag("html5_byterate_constraints")) SQ = true;
  if (flag("html5_use_non_active_broadcast_for_post_live")) VH = true;
  if (flag("html5_enable_encrypted_av1")) aR = true;
  setBandwidthCookieMaxAge(getExperimentValue(config.experiments, "html5_sticky_duration_mos"));
}

// ---------------------------------------------------------------------------
// Bandwidth estimation  (line 52936)
// ---------------------------------------------------------------------------

/**
 * Computes the effective bandwidth estimate in bytes/sec, blending the
 * raw byte-rate with the adjusted-bandwidth estimator.
 *
 * @param {Object}  estimator        Bandwidth estimator.          [was: Q]
 * @param {boolean} [adjusted=false] Whether to apply adjustments. [was: c]
 * @param {number}  [maxBytes=1048576] Max bytes for scaling.      [was: W]
 * @returns {number}                 Estimated bandwidth in bytes/sec.
 *
 * [was: U6]
 */
export function computeBandwidthEstimate(estimator, adjusted = false, maxBytes = 1048576) { // was: U6
  let rawRate = getRawByterate(estimator); // was: m  // was: BZ
  rawRate = 1 / ((estimator.J.Bj() || 0) * estimator.policy.Y + 1 / rawRate);
  let adjustedRate = estimator.MM.Bj(); // was: K
  adjustedRate = adjustedRate > 0 ? adjustedRate : 1;
  let blended = Math.max(rawRate, adjustedRate); // was: T
  if (estimator.policy.j > 0 && adjustedRate < rawRate) {
    blended = Math.min(estimator.policy.j, 1);
    blended = (1 - blended) * rawRate + blended * adjustedRate;
  }
  if (!adjusted) return blended;

  const delay = 1e-9 + getEstimatedDelay(estimator); // was: c (reused)  // was: X0
  let result = blended * Math.min(1, maxBytes / (blended * delay)); // was: W (reused)
  if (!estimator.policy.O) {
    let variancePenalty = ((estimator.Y.percentile(0.98) || 0) - 1) / 2; // was: Q (reused)
    variancePenalty = Math.max(0, Math.min(1, variancePenalty));
    result *= 1 - 0.5 * variancePenalty;
  }
  return result;
}

/**
 * Returns the estimated round-trip delay (combined request + response).
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @returns {number}          Delay in seconds (clamped to [0..5]).
 *
 * [was: X0]
 */
export function getEstimatedDelay(estimator) { // was: X0
  let delay = estimator.L.Bj() + estimator.Ie.Bj() || 0;
  delay = isNaN(delay) ? 0.5 : delay;
  return Math.min(delay, 5);
}

/**
 * Captures a bandwidth snapshot for telemetry reporting.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @returns {Object}          Snapshot with delay, stall, byterate, etc.
 *
 * [was: x$]
 */
export function captureBandwidthSnapshot(estimator) { // was: x$
  const snapshot = { // was: c
    delay: getEstimatedDelay(estimator),
    stall: estimator.J.Bj() || 0,
    byterate: getRawByterate(estimator),
    init: estimator.Ka
  };
  const bucket = estimator.A[0]; // was: W
  bucket.stamp = Math.round(estimator.D / 3600000) * 3600000; // was: 36E5
  bucket.net = Math.ceil(estimator.T2);
  bucket.max = estimator.interruptions[0] || 0;
  snapshot.interruptions = estimator.A;
  return snapshot;
}

/**
 * Marks the start of a bandwidth measurement window.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 *
 * [was: DY0]
 */
export function startBandwidthMeasurement(estimator) { // was: DY0
  if (!estimator.K) estimator.K = (0, g.h)();
  if (estimator.policy.L) estimator.D = (0, g.h)();
}

/**
 * Records an interruption (stall) of `duration` ms.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @param {number} timestamp  Current timestamp (ms). [was: c]
 *
 * [was: $50]
 */
export function recordInterruption(estimator, timestamp) { // was: $50
  if (estimator.K) {
    const gap = timestamp - estimator.K; // was: W
    if (gap < 60000) { // was: 6E4
      if (gap > 1000) { // was: 1E3
        const list = estimator.interruptions; // was: m
        list.push(Math.ceil(gap));
        list.sort((a, b) => b - a);
        if (list.length > 16) list.pop();
      }
      estimator.T2 += gap;
    }
  }
  estimator.K = timestamp;
}

/**
 * Accumulates downloaded bytes and media time.
 *
 * @param {Object} estimator  Bandwidth estimator.     [was: Q]
 * @param {number} bytes      Downloaded bytes.         [was: c]
 * @param {number} mediaTime  Media time in seconds.    [was: W]
 *
 * [was: qm]
 */
export function accumulateBytes(estimator, bytes, mediaTime) { // was: qm
  if (!isNaN(mediaTime)) estimator.isSamsungSmartTV += mediaTime;
  if (!isNaN(bytes)) estimator.UH += bytes;
}

/**
 * Records a single request's byte-rate sample.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @param {number} bytes      Bytes transferred.     [was: c]
 * @param {number} duration   Duration in seconds.   [was: W]
 * @param {number} [weight=bytes] Weight for the sample. [was: m]
 *
 * [was: F0]
 */
export function recordByterateSample(estimator, bytes, duration, weight = bytes) { // was: F0
  estimator.j.ER(weight, duration / bytes);
  estimator.D = (0, g.h)();
}

/**
 * Records a stall-rate sample.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @param {number} bytes      Bytes in the stall period. [was: c]
 * @param {number} stallTime  Stall duration in seconds. [was: W]
 *
 * [was: nt]
 */
export function recordStallSample(estimator, bytes, stallTime) { // was: nt
  bytes = Math.max(bytes, estimator.O.W);
  estimator.J.ER(1, stallTime / bytes);
}

/**
 * Records an adjusted-bandwidth sample and optionally reports a
 * telemetry snapshot.
 *
 * @param {Object}  estimator   Bandwidth estimator.        [was: Q]
 * @param {number}  bytes       Bytes transferred.           [was: c]
 * @param {number}  duration    Duration in seconds.         [was: W]
 * @param {number}  mediaTime   Media time for variance.     [was: m]
 * @param {boolean} isStall     Whether this was a stall.    [was: K]
 * @param {boolean} [noResetK=false] Skip resetting K.      [was: T]
 *
 * [was: DC]
 */
export function recordAdjustedSample(estimator, bytes, duration, mediaTime, isStall, noResetK = false) { // was: DC  // was: !1
  estimator.MM.ER(bytes, duration / bytes);
  estimator.D = (0, g.h)();
  if (!isStall) estimator.Y.ER(1, bytes - mediaTime);
  if (!noResetK) estimator.K = 0;
  if (estimator.S > -1 && (0, g.h)() - estimator.S > 30000) { // was: 3E4
    persistBandwidth(captureBandwidthSnapshot(estimator));
    estimator.S = (0, g.h)();
    estimator.mF = true; // was: !0
  }
}

/**
 * Returns whether enough time has elapsed since the last measurement.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @returns {boolean}
 *
 * [was: CE]
 */
export function isMeasurementStale(estimator) { // was: CE
  return (0, g.h)() - estimator.D >= 4000; // was: 4E3
}

/**
 * Returns the raw byte rate from the estimator.
 *
 * @param {Object} estimator  Bandwidth estimator.  [was: Q]
 * @returns {number}
 *
 * [was: BZ]
 */
export function getRawByterate(estimator) { // was: BZ
  const rate = estimator.j.Bj();
  return rate > 0 ? rate : 1;
}

/**
 * Populates a telemetry object with bandwidth statistics.
 *
 * @param {Object}  estimator  Bandwidth estimator.                 [was: Q]
 * @param {Object}  telemetry  Target telemetry object.              [was: c]
 * @param {boolean} [detailed=false] Include detailed percentiles.  [was: W]
 *
 * [was: t8K]
 */
export function populateBandwidthTelemetry(estimator, telemetry, detailed = false) { // was: t8K  // was: !1
  telemetry.Ry = estimator.isSamsungSmartTV;
  telemetry.f7 = estimator.UH;
  telemetry.bandwidthEstimate = computeBandwidthEstimate(estimator);

  if (detailed) {
    const ttr = (estimator.L.Bj() * 1000).toFixed(); // was: W (reused)  // was: 1E3
    const ttm = (estimator.Ie.Bj() * 1000).toFixed();
    const delay = getEstimatedDelay(estimator).toFixed(2);
    const stall = ((estimator.J.Bj() || 0) * 1e9).toFixed(2);
    const bw = estimator.j.Bj().toFixed(0);
    const abw = estimator.MM.Bj().toFixed(0);
    const v50 = estimator.Y.percentile(0.5).toFixed(2);
    const v92 = estimator.Y.percentile(0.92).toFixed(2);
    const v96 = estimator.Y.percentile(0.96).toFixed(2);
    const v98 = estimator.Y.percentile(0.98).toFixed(2);

    if (!estimator.W) estimator.W = new tL;
    else estimator.W.reset();
    estimator.W.add(estimator.T2);
    estimator.W.add(estimator.interruptions.length);

    let prev = 0;
    for (let i = estimator.interruptions.length - 1; i >= 0; i--) {
      const gap = estimator.interruptions[i];
      estimator.W.add(gap - prev);
      prev = gap;
    }

    prev = 0;
    for (let i = estimator.A.length - 1; i >= 0; i--) {
      const bucket = estimator.A[i];
      const stamp = bucket.stamp / 3600000; // was: 36E5
      estimator.W.add(stamp - prev);
      prev = stamp;
      estimator.W.add(bucket.net / 1000); // was: 1E3
      estimator.W.add(bucket.max);
    }

    const encoded = estimator.W.Eg(); // was: Q (reused)
    telemetry.W = { ttr, ttm, d: delay, st: stall, bw, abw, v50, v92, v96, v98, "int": encoded };
  }
}

/**
 * Creates a bandwidth estimator with the given configuration.
 *
 * @param {boolean} useMediaTimeWeight  Whether to weight by media time. [was: Q]
 * @param {number}  initialByterate     Initial byte rate hint.          [was: c]
 * @param {Object}  experiments         Experiment flag provider.         [was: W]
 * @returns {Object}                    New bandwidth estimator (HIm).
 *
 * [was: NHW]
 */
export function createBandwidthEstimator(useMediaTimeWeight, initialByterate, experiments) { // was: NHW
  const estimator = new HIm(experiments); // was: m
  if (useMediaTimeWeight) {
    estimator.A = true; // was: !0
    estimator.K = 0.1;
  }
  if (experiments.SG("html5_media_time_weight")) estimator.A = false; // was: !1
  if (initialByterate) estimator.W = initialByterate / 8;
  estimator.O = getPersistedQuality() >= 480;
  return estimator;
}

// ---------------------------------------------------------------------------
// Segment timeline tracking  (line 53097)
// ---------------------------------------------------------------------------

/**
 * Initializes a segment-tracking entry with a start time and flags.
 *
 * @param {Object}  entry          Segment tracking entry.        [was: Q]
 * @param {number}  startTimeSecs  Start time in seconds.         [was: c]
 * @param {boolean} [isActive=true] Whether the entry is active.  [was: W]
 *
 * [was: iI7]
 */
export function initSegmentEntry(entry, startTimeSecs, isActive = true) { // was: iI7  // was: !0
  entry.W = 0;
  entry.startTimeSecs = startTimeSecs;
  entry.A = isActive;
  entry.O = true; // was: !0
}

/**
 * Finds a segment entry by media time with a tolerance window.
 *
 * @param {Object} timeline     Segment timeline.            [was: Q]
 * @param {number} mediaTimeMs  Media time in milliseconds.  [was: c]
 * @param {number} toleranceMs  Tolerance window in ms.      [was: W]
 * @returns {Object|undefined}  Matching entry, or undefined.
 *
 * [was: yW_]
 */
export function findSegmentByMediaTime(timeline, mediaTimeMs, toleranceMs) { // was: yW_
  const entries = timeline.O; // was: Q (reused)
  let idx = binarySearch(entries, { CX: mediaTimeMs }, (a, b) => a.CX - b.CX); // was: m
  idx = idx < 0 ? (idx + 2) * -1 : idx;
  if (idx >= 0) {
    for (let i = idx; i <= idx + 1 && i < entries.length; i++) { // was: K
      const entry = entries[i]; // was: T
      if (mediaTimeMs >= entry.CX - toleranceMs && mediaTimeMs <= entry.yz + toleranceMs) {
        return entry;
      }
    }
  }
}

/**
 * Inserts a segment entry into the lookup-by-break-id map.
 *
 * @param {Object} timeline  Segment timeline.    [was: Q]
 * @param {string} breakId   Break identifier.    [was: c]
 * @param {Object} entry     Segment entry.       [was: W]
 *
 * [was: Snn]
 */
export function insertIntoBreakMap(timeline, breakId, entry) { // was: Snn
  const existing = timeline.W.get(breakId); // was: m
  if (existing) {
    existing.push(entry);
    g.iD(existing, (a, b) => a.CX - b.CX);
  } else {
    timeline.W.set(breakId, [entry]);
  }
}

/**
 * Inserts a segment entry into the sorted timeline array.
 *
 * @param {Object} timeline  Segment timeline.  [was: Q]
 * @param {Object} entry     Segment entry.     [was: c]
 *
 * [was: FIR]
 */
export function insertSegmentEntry(timeline, entry) { // was: FIR
  sortedInsert(timeline.O, entry, (a, b) => a.CX === b.CX ? a.durationMs - b.durationMs : a.CX - b.CX);
  timeline.A.set(entry.cpn, entry);
  if (entry.OE) insertIntoBreakMap(timeline, entry.OE, entry);
}

/**
 * Removes segment entries matching a predicate.
 *
 * @param {Object}   timeline   Segment timeline.                   [was: Q]
 * @param {Function} predicate  Function returning true for removal. [was: c]
 *
 * [was: ZI3]
 */
export function removeSegmentEntries(timeline, predicate) { // was: ZI3
  const kept = []; // was: W
  for (const entry of timeline.O) {
    if (!predicate(entry)) kept.push(entry);
  }
  if (timeline.FI.X("html5_sstm_fixes")) {
    for (const entry of timeline.O) {
      if (predicate(entry)) timeline.A.delete(entry.cpn);
    }
  }
  timeline.O = kept;
}

/**
 * Finds a segment entry by its end time (yz field) using binary search.
 *
 * @param {Object} timeline  Segment timeline.    [was: Q]
 * @param {number} endTimeMs End time in ms.       [was: c]
 * @returns {Object|null}
 *
 * [was: EZn]
 */
export function findSegmentByEndTime(timeline, endTimeMs) { // was: EZn
  const idx = binarySearch(timeline.O, { yz: endTimeMs }, (a, b) => a.yz - b.yz);
  return idx >= 0 ? timeline.O[idx] : null;
}

/**
 * Removes a specific segment entry from the timeline.
 *
 * @param {Object} timeline  Segment timeline.  [was: Q]
 * @param {Object} entry     Entry to remove.    [was: c]
 *
 * [was: s10]
 */
export function removeSegmentEntry(timeline, entry) { // was: s10
  const idx = timeline.O.indexOf(entry);
  if (idx >= 0) timeline.O.splice(idx, 1);
  timeline.A.delete(entry.cpn);
}

// ---------------------------------------------------------------------------
// SSDAI prebuffer cueing  (line 53153)
// ---------------------------------------------------------------------------

/**
 * Processes an incoming ad cuepoint, determining whether to start a new
 * ad-fetch window or handle duplicate/stale cuepoints.
 *
 * @param {Object} manager   SSDAI cue manager.      [was: Q]
 * @param {Object} cuepoint  Incoming cuepoint data.  [was: c]
 *
 * [was: pEW]
 */
export function processAdCuepoint(manager, cuepoint) { // was: pEW
  if (manager.ol || (cuepoint.identifier && manager.EXP_748402147.has(cuepoint.identifier))) {
    manager.reportTelemetry({ startnoad: cuepoint.identifier });
    cancelAdFetch(manager); // was: HZ
  } else if (Jy(manager.Y, (entry) => entry.identifier === cuepoint.identifier)) {
    manager.reportTelemetry({ timedoutcp: 1 });
    manager.J.start(0);
  } else if (Jy(manager.PA, (entry) => entry.identifier === cuepoint.identifier)) {
    manager.reportTelemetry({ fetchedcp: 1 });
    cancelAdFetch(manager);
  } else if (manager.J.isActive()) {
    manager.reportTelemetry({ racingcp: `${manager.D?.identifier}_${cuepoint.identifier}` });
  } else {
    manager.applyQualityConstraint = new Date().getTime() / 1000; // was: 1E3
    manager.reportTelemetry({ adf: 1 });
    let timeout = 5000; // was: W  // was: 5E3
    if (cuepoint.event === "predictStart") timeout -= cuepoint.W;
    manager.La = Math.max(timeout, 15000); // was: 15E3
    manager.L = false; // was: !1
    manager.J.start(manager.La);
    manager.D = cuepoint;
    manager.S.clearAll();
    manager.parseHexColor = [];
  }
}

/**
 * Cancels the pending ad-fetch and stops the timeout timer.
 *
 * @param {Object} manager  SSDAI cue manager.  [was: Q]
 *
 * [was: HZ]
 */
export function cancelAdFetch(manager) { // was: HZ
  manager.L = false;
  if (manager.J.isActive()) logAdFetchTimeout(manager); // was: ZC
  manager.J.stop();
  manager.clientHintsOverride(false);
}

/**
 * Logs an ad-fetch timeout telemetry event.
 *
 * @param {Object} manager  SSDAI cue manager.  [was: Q]
 *
 * [was: ZC]
 */
export function logAdFetchTimeout(manager) { // was: ZC
  if (manager.JJ) {
    manager.reportTelemetry({
      adf: `0_${new Date().getTime() / 1000 - manager.d3}_isTimeout_${manager.L}` // was: 1E3
    });
  }
}

/**
 * Checks whether a seek target overlaps with a pending ad cuepoint's
 * time range, returning the cuepoint if so.
 *
 * @param {Object} manager      SSDAI cue manager.         [was: Q]
 * @param {number} seekStartMs  Seek start in ms.           [was: c]
 * @param {number} seekEndMs    Seek end in ms.             [was: W]
 * @returns {Object|undefined}
 *
 * [was: bId]
 */
export function findOverlappingAdCuepoint(manager, seekStartMs, seekEndMs) { // was: bId
  if (!manager.Y.length) return;
  for (const cue of manager.Y) {
    const startMs = cue.startSecs * 1000; // was: K  // was: 1E3
    const endMs = cue.rejectedPromise * 1000 + startMs; // was: T
    if ((seekStartMs > startMs && seekStartMs < endMs) || (seekEndMs > startMs && seekEndMs < endMs)) {
      if (!Jy(manager.mainVideoEntityActionMetadataKey, (skipped) => skipped.identifier === cue.identifier)) {
        manager.reportTelemetry({ adskip: seekStartMs });
        manager.mainVideoEntityActionMetadataKey.push(cue);
      }
      return cue;
    }
  }
}

/**
 * Forwards an ad-insertion command to the playback mode.
 *
 * @param {Object} manager  SSDAI cue manager.  [was: Q]
 * @param {*}      cmd      Command data.        [was: c]
 * @param {*}      arg      Command argument.    [was: W]
 *
 * [was: ED]
 */
export function forwardAdCommand(manager, cmd, arg) { // was: ED
  manager.W.i$(cmd, arg);
}

/**
 * Builds a tile-context key for segment lookup.
 *
 * @param {Object} manager   SSDAI cue manager.    [was: Q]
 * @param {Object} [context] Optional tile context.  [was: c]
 * @returns {string}
 *
 * [was: gZ0]
 */
export function buildTileContextKey(manager, context) { // was: gZ0
  if (!context) return "";
  return manager.FI.getExperimentFlags.W.BA(j1y) && context?.tileContext
    ? `${context?.fK};${context?.tileContext}`
    : context?.fK;
}

/**
 * Creates a new ad-playback overlay for a given CPN and registers it.
 *
 * @param {Object} manager   SSDAI cue manager.            [was: Q]
 * @param {Object} videoData Video data for the ad.         [was: c]
 * @param {number} startMs   Start time in milliseconds.    [was: W]
 *
 * [was: f$0]
 */
export function createAdPlaybackOverlay(manager, videoData, startMs) { // was: f$0
  (manager.app.stepGenerator().j[videoData.clientPlaybackNonce] || null)?.dispose();
  const overlay = new AdUxStateMetadata(videoData, manager.W, startMs / 1000); // was: c (reused)  // was: 1E3
  manager.T2.set(overlay.Sr(), overlay);
  const presenters = manager.app.stepGenerator(); // was: Q (reused)
  presenters.j[overlay.Sr()] = overlay;
  presenters.K[overlay.Sr()] = overlay;
}

/**
 * Builds a telemetry payload for server-stitched video change events.
 *
 * @param {Object} manager    SSDAI cue manager.                   [was: Q]
 * @param {string} eventType  Event type string (e.g. "c2a", "a2c"). [was: c]
 * @param {Object} [entry]    Segment entry for CPN/video data.      [was: W]
 * @returns {Object}
 *
 * [was: sD]
 */
export function buildSsdaiTelemetry(manager, eventType, entry) { // was: sD
  return {
    ssvc: eventType,
    cpn: entry?.cpn || "",
    vid: entry?.videoData.videoId || "",
    ct: (manager.W.getCurrentTime() || 0).toFixed(3),
    cmt: (manager.W.getTimeHead || 0).toFixed(3)
  };
}

/**
 * Creates a server-stitched cue range with the given bounds and ID.
 *
 * @param {number} startMs  Start time in ms.     [was: Q]
 * @param {number} endMs    End time in ms.        [was: c]
 * @param {string} id       Cue range identifier.  [was: W]
 * @returns {Object}        CueRange instance (C8).
 *
 * [was: vZ_]
 */
export function createSsdaiCueRange(startMs, endMs, id) { // was: vZ_
  return new CueRange(startMs, endMs, {
    id,
    namespace: "serverstitchedcuerange",
    priority: 9
  });
}
