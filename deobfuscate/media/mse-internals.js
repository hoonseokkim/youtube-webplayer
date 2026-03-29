/**
 * mse-internals.js -- MediaSource/SourceBuffer internal management
 *
 * Deobfuscated from YouTube's base.js
 * Source: player_es6.vflset/en_US/base.js, lines ~42251-42999
 *
 * Handles:
 *  - QoE (Quality of Experience) error reporting (RF_, Kw, WxK)
 *  - Player visibility tracking and first-frame timing (mLx, TK)
 *  - Seek event routing (yh, Kxd)
 *  - Codec reset delay management (Do) - calculates how long to delay before
 *    requesting more data based on buffer sizes and codec constraints
 *  - Source buffer rollback handling (Rb) for server-stitched DAI
 *  - Request scheduling: should-fetch decision logic (MJ, NgO, bFn)
 *  - Source buffer attach/detach lifecycle (Bg0, xL7, qxK)
 *  - Init-segment append pipeline (qF) with codec-change detection
 *  - Media-segment append pipeline (FxR) with quota-exceeded handling
 *  - Append error classification and recovery (yk0, xz)
 *  - Manifestless live index reconciliation (rlx)
 *  - SABR / Onesie media attachment validation (XrW, A6, Ak_)
 *  - Format switching at the loader level (eg, RT)
 *  - WebM spoof-to-4K for power-efficient decode workaround (iJW)
 *  - Various loader utilities: suspend/resume, poll, live-edge seek
 *
 * @module media/mse-internals
 */

// ============================================================================
// QoE error reporting
// ============================================================================


import { ThrottleTimer } from '../core/bitstream-helpers.js'; // was: g.Uc
import { reportErrorWithLevel } from '../data/gel-params.js'; // was: g.Zf
import { isMp4Container } from './codec-helpers.js'; // was: g.Gb
import { recordTimedStat } from './engine-config.js'; // was: g.J8
import { ensureTransitionPings } from './source-buffer.js'; // was: g.N5
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { appendStatEntry } from './engine-config.js'; // was: MT
import { getSlotState } from '../ads/ad-scheduling.js'; // was: zA
import { loadVideoFromData } from '../player/media-state.js'; // was: sH
import { cueAdVideo } from '../player/media-state.js'; // was: OH
import { handleBackgroundSuspend } from './quality-constraints.js'; // was: w3
import { traverseElementPath } from './format-parser.js'; // was: TJ
import { isMediaSourceOpen } from './codec-helpers.js'; // was: Qv
import { NoOpLogger } from '../data/logger-init.js'; // was: WG
import { findRangeIndex } from './codec-helpers.js'; // was: hm
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { updateGridState } from '../player/video-loader.js'; // was: sd
import { truncateSegments } from '../ads/ad-async.js'; // was: Z2
import { enumReader } from '../proto/message-setup.js'; // was: lt
import { MeasurementHook } from '../data/module-init.js'; // was: H5
import { testUrlPattern } from '../ads/ad-scheduling.js'; // was: tI
import { createDualSourceBuffers } from './source-buffer.js'; // was: tUK
import { logIllegalStage } from '../ads/ad-scheduling.js'; // was: md
import { rewriteEncryptionInfo } from './format-setup.js'; // was: TKO
import { getUint8View } from '../data/collection-utils.js'; // was: Cp
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { filterAndSortFormats } from '../data/bandwidth-tracker.js'; // was: as
import { LatencyTimer } from '../data/logger-init.js'; // was: DB
import { ProtobufMessage } from '../proto/message-setup.js'; // was: Zd
import { appendToSourceBuffer } from './mse-internals.js'; // was: yk0
import { reportAppendError } from './mse-internals.js'; // was: xz
import { writeMessageField } from '../proto/varint-decoder.js'; // was: Lo
import { findChapterAtPixel } from '../ui/seek-bar-tail.js'; // was: HC
import { configureSourceBuffer } from './media-source.js'; // was: X3
import { enterRollUp } from '../modules/caption/caption-internals.js'; // was: sr
import { invokeUnaryRpc } from './bitstream-reader.js'; // was: BG
import { stripBox } from './format-setup.js'; // was: mC
import { seekToElement } from './format-parser.js'; // was: rv
import { getProgressBarMetrics } from '../ui/progress-bar-impl.js'; // was: BC
import { isInAdPlayback } from '../ads/dai-cue-range.js'; // was: WB
import { resetTrackState } from './buffer-stats.js'; // was: r4
import { isTrackHeadBuffered } from './track-manager.js'; // was: tPd
import { unlockTrackSegment } from './track-manager.js'; // was: BP
import { dispatchLayoutEvent } from './source-buffer.js'; // was: DK
import { globalSamplingState } from '../data/module-init.js'; // was: nX
import { OrchestrationAction } from '../modules/offline/download-manager.js'; // was: es
import { onApplicationStateChange } from '../player/player-events.js'; // was: uo
import { isTextTrackMimeType } from './codec-helpers.js'; // was: LM
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { iterateCursor } from '../data/idb-transactions.js'; // was: zE
import { isPlayableLive } from '../ads/ad-async.js'; // was: sx
import { createClientScreen } from '../ads/ad-async.js'; // was: Rm
import { isSplitScreenEligible } from './audio-normalization.js'; // was: UP
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { isHttps } from '../data/idb-transactions.js'; // was: Gn
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getCurrentTime, getDuration } from '../player/time-tracking.js';
import { getVisibilityState } from '../core/composition-helpers.js';
import { seekTo } from '../ads/dai-cue-range.js';
import { rollbackTrack, recordSegmentBitrate, estimateBitrate, selectNextQuality } from './segment-request.js';
import { isGaplessShortEligible } from './seek-controller.js';
import { appendBuffer } from '../data/collection-utils.js';
import { handleError } from '../player/context-updates.js';
import { getYtNow } from '../player/time-tracking.js'; // was: g.Yo
// TODO: resolve g.h
// TODO: resolve g.kV
// TODO: resolve g.uj
// TODO: resolve g.y1

/**
 * Report a QoE error event. Detects Chrome 96 net.badstatus/rc.500 as a
 * known browser bug (force reconnect) and UMP b248180278.
 *
 * [was: RF_]
 *
 * @param {Object} reporter  [was: Q]
 * @param {number} timestamp [was: c]
 * @param {string} errorCode [was: W]
 * @param {number} severity  [was: m] - 1 = fatal, other = non-fatal
 * @param {string} details   [was: K]
 */
export function reportQoeError(reporter, timestamp, NetworkErrorCode, severity, details) { // was: RF_
  const browserVersion = reporter.provider.FI.W.cbrver; // was: T

  // Chrome 96 net.badstatus with rc.500 -> force reconnect
  reporter.provider.FI.W.cbr === 'Chrome' &&
    /^96[.]/.test(browserVersion) &&
    NetworkErrorCode === 'net.badstatus' &&
    /adMessageRenderer\.500/.test(details) &&
    forceReconnect(reporter, 3);

  // UMP error detection
  reporter.provider.FI.X('html5_use_ump') &&
    /b248180278/.test(details) &&
    forceReconnect(reporter, 4);

  const currentTime = reporter.provider.getCurrentTime(); // was: T (reused)
  const fatalStr = severity === 1 ? 'fatal' : ''; // was: m (reused)
  const parts = [NetworkErrorCode, fatalStr, currentTime.toFixed(3)]; // was: W (reused)

  fatalStr && (details += `;a6s.${i1()}`);
  details && parts.push(sanitizeErrorDetails(details));

  recordTimedStat(reporter, timestamp, 'error', parts);
  reporter.K = true; // was: !0
}

/**
 * Mark the reporter as needing a force-reconnect due to a known browser bug.
 * [was: Kw]
 *
 * @param {Object} reporter [was: Q]
 * @param {number} reason   [was: c]
 */
export function forceReconnect(reporter, reason) { // was: Kw
  reporter.JJ || (appendStatEntry(reporter, 'fcnz', `${reason}`), (reporter.JJ = true)); // was: !0
}

/**
 * Sanitize error detail strings for safe logging (replace non-alphanumeric chars).
 * [was: WxK]
 *
 * @param {string} details [was: Q]
 * @returns {string}
 */
export function sanitizeErrorDetails(details) { // was: WxK
  /[^a-getSlotState-Z0-9;.!_-]/.test(details) &&
    (details = details.replace(/[+]/g, '-').replace(/[^a-getSlotState-Z0-9;.!_-]/g, '_'));
  return details;
}

// ============================================================================
// Player visibility and timing
// ============================================================================

/**
 * Mark the player as visible (first meaningful paint timestamp).
 * Defers if the provider isn't in a suitable state or the page is hidden.
 * [was: mLx]
 *
 * @param {Object} reporter [was: Q]
 */
export function markPlayerVisible(reporter) { // was: mLx
  reporter.j >= 0 ||
    (reporter.provider.FI.dA || reporter.provider.EH.getVisibilityState() !== 3
      ? (reporter.j = getYtNow(reporter.provider))
      : (reporter.UH = true)); // was: !0
}

/**
 * Build a seek-source key string for QoE logging.
 * For offline media, returns source 4 with mode 1.
 * [was: Kxd]
 *
 * @param {Object} reporter [was: Q]
 * @param {Object} seekInfo [was: c]
 * @returns {string}
 */
export function buildSeekSourceKey(reporter, seekInfo) { // was: Kxd
  let source; // was: W
  let mode; // was: W (reused)

  if (reporter.provider.videoData.MQ()) {
    source = 4;
    mode = 1;
  } else {
    source = seekInfo.source ?? 0;
  }

  let key = `sms.${source}`; // was: Q (reused)
  mode !== undefined && (key += `_${mode}`); // was: void 0
  return key;
}

/**
 * Log a video-player-state transition event.
 * [was: TK]
 *
 * @param {Object} reporter    [was: Q]
 * @param {number} stateCode   [was: c]
 * @param {string} stateExtra1 [was: W]
 * @param {string} stateExtra2 [was: m]
 * @param {number} mediaTime   [was: K]
 */
export function logPlayerStateTransition(reporter, stateCode, stateExtra1, stateExtra2, mediaTime) { // was: TK
  const providerTime = getYtNow(reporter.provider); // was: T
  (stateCode === 1 || stateCode === 3 || stateCode === 5) && recordTimedStat(reporter, providerTime, 'vps', [reporter.GU]);
  appendStatEntry(reporter, 'xvt', `t.${providerTime.toFixed(3)};m.${mediaTime.toFixed(3)};g.2;tt.${stateCode};np.0;c.${stateExtra1};d.${stateExtra2}`);
}

// ============================================================================
// Codec reset delay management
// ============================================================================

/**
 * Calculate the maximum time (in seconds) we are willing to buffer ahead
 * before pausing further requests. Accounts for:
 *  - Suspension state
 *  - MediaSource readiness
 *  - Audio/video buffer size policies
 *  - Time-based growth after a minimum threshold
 *
 * [was: Do]
 *
 * @param {Object} loader    [was: Q]
 * @param {Object} sliceInfo [was: c]
 * @returns {number} seconds
 */
export function computeCodecResetDelay(loader, sliceInfo) { // was: Do
  if (loader.XI && !loader.eb) return 3;
  if (loader.isSuspended) return 1;
  if (loader.loadVideoFromData?.MM()) return 4;

  let maxAhead = // was: W
    (sliceInfo.cueAdVideo.info.audio ? loader.policy.Y0 : loader.policy.jG) /
    (sliceInfo.handleBackgroundSuspend * loader.policy.uE);

  if (
    loader.policy.traverseElementPath > 0 &&
    loader.loadVideoFromData &&
    isMediaSourceOpen(loader.loadVideoFromData)
  ) {
    const sourceBuffer = sliceInfo.cueAdVideo.info.video ? loader.loadVideoFromData.O : loader.loadVideoFromData.W; // was: c (reused)
    if (sourceBuffer && !sourceBuffer.yq()) {
      const ranges = sourceBuffer.NoOpLogger(); // was: c (reused)
      const bufIdx = findRangeIndex(ranges, loader.getCurrentTime()); // was: m
      if (bufIdx >= 0) {
        const elapsed = loader.getCurrentTime() - ranges.start(bufIdx); // was: c (reused)
        maxAhead += Math.max(0, Math.min(elapsed - loader.policy.traverseElementPath, loader.policy.cD));
      }
    }
  }

  loader.policy.Ie > 0 && (maxAhead = Math.min(maxAhead, loader.policy.Ie));
  return maxAhead;
}

// ============================================================================
// Seek routing
// ============================================================================

/**
 * Perform a seek by routing through the external handler (EH.seekTo).
 * Logs format-switch timing if the seek happens soon after a bandwidth switch.
 * [was: yh]
 *
 * @param {Object} loader   [was: Q]
 * @param {number} seekTime [was: c]
 * @param {Object} seekCtx  [was: W]
 */
export function routeSeek(loader, seekTime, seekCtx) { // was: yh
  Tgy(loader, seekCtx.Z7 || 'unknown');
  loader.EH.seekTo(seekTime, seekCtx);
}

// ============================================================================
// DAI rollback
// ============================================================================

/**
 * Roll back audio and/or video tracks when a DAI (Dynamic Ad Insertion)
 * segment boundary requires resynchronization.
 * [was: Rb]
 *
 * @param {Object} loader     [was: Q]
 * @param {number} targetTime [was: c]
 * @param {number} seekTime   [was: W]
 * @param {number} segmentNum [was: m]
 * @param {number} [duration] [was: K]
 */
export function daiRollback(loader, targetTime, seekTime, segmentNum, duration) { // was: Rb
  if (loader.EH.getVideoData().listenOnce()) {
    duration &&
      loader.O.Ka + duration / 1e3 > seekTime &&
      (loader.RetryTimer('sdai', {
        seg: segmentNum,
        rbt: seekTime.toFixed(3),
        end: loader.O.Ka.toFixed(3),
        updateGridState: duration.toFixed(3),
      }),
      loader.Fn(false, 'rollback')); // was: !1
  } else {
    loader.policy.O && loader.Fn(false, 'rollback');
  }

  if (loader.k0.isManifestless) {
    const audioRolled = rollbackTrack(loader.audioTrack, segmentNum, seekTime, targetTime); // was: K (reused)
    const videoRolled = rollbackTrack(loader.videoTrack, segmentNum, seekTime, targetTime); // was: T

    if (!loader.policy.u3) {
      videoRolled && truncateSegments(loader.k0, segmentNum, true); // was: !0
      audioRolled && truncateSegments(loader.k0, segmentNum, false); // was: !1
    }

    videoRolled && (loader.videoTrack.Y = []);
    audioRolled && (loader.audioTrack.Y = []);

    loader.RetryTimer('sdai', {
      rollbk2_seg: segmentNum,
      rbt: seekTime.toFixed(3),
      enumReader: targetTime.toFixed(3),
      a: audioRolled,
      v: videoRolled,
    });

    (audioRolled || videoRolled) && loader.policy.O && wB(loader);
  }
}

// ============================================================================
// Source-buffer lifecycle
// ============================================================================

/**
 * Detach source buffers from the media element, resetting track state.
 * [was: Bg0]
 *
 * @param {Object} loader      [was: Q]
 * @param {boolean} [keepLast=false] [was: c]
 */
export function detachSourceBuffers(loader, keepLast = false) { // was: Bg0
  loader.loadVideoFromData &&
    loader.loadVideoFromData.W &&
    loader.loadVideoFromData.O &&
    (loader.loadVideoFromData.W.iG(loader.JJ, loader), loader.loadVideoFromData.O.iG(loader.JJ, loader));

  br(loader.audioTrack, null, keepLast);
  br(loader.videoTrack, null, keepLast);

  loader.loadVideoFromData && (loader.loadVideoFromData.K = false); // was: !1
  loader.loadVideoFromData = null;
}

/**
 * Attach source buffers to the media element and resume playback.
 * [was: xL7]
 *
 * @param {Object}  loader     [was: Q]
 * @param {Object}  bufferPair [was: c]
 * @param {boolean} [skipResume=false] [was: W]
 * @param {boolean} [keepOld=false]    [was: m]
 */
export function attachSourceBuffers(loader, bufferPair, skipResume = false, keepOld = false) { // was: xL7
  br(loader.videoTrack, bufferPair.O || null, keepOld);
  br(loader.audioTrack, bufferPair.W || null, keepOld);

  loader.loadVideoFromData = bufferPair;
  loader.loadVideoFromData.K = true; // was: !0

  skipResume || loader.resume();
  bufferPair.W.MeasurementHook(loader.JJ, loader);
  bufferPair.O.MeasurementHook(loader.JJ, loader);
}

/**
 * Full MSE reset: detach old buffers, configure new pair, re-attach.
 * [was: qxK]
 *
 * @param {Object}  loader     [was: Q]
 * @param {Object}  bufferPair [was: c]
 * @param {boolean} [skipResume=false] [was: W]
 * @param {boolean} [keepOld=false]    [was: m]
 */
export function resetMediaSource(loader, bufferPair, skipResume = false, keepOld = false) { // was: qxK
  if (loader.policy.MM) {
    loader.policy.Ka && loader.RetryTimer('loader', { setsmb: 0 });
    loader.testUrlPattern();
    loader.policy.MM = false; // was: !1
  }

  detachSourceBuffers(loader, keepOld);

  if (!bufferPair.D()) {
    const pendingVideo = Hp(loader.videoTrack); // was: K
    const pendingAudio = Hp(loader.audioTrack); // was: T
    createDualSourceBuffers(
      bufferPair,
      (pendingVideo ? pendingVideo.info.cueAdVideo : loader.videoTrack.cueAdVideo).info,
      (pendingAudio ? pendingAudio.info.cueAdVideo : loader.audioTrack.cueAdVideo).info,
      loader.policy.Q1
    );
  }

  attachSourceBuffers(loader, bufferPair, skipResume, keepOld);

  try {
    loader.JF();
  } catch (err) { // was: K
    reportErrorWithLevel(err);
  }
}

// ============================================================================
// Init-segment append pipeline
// ============================================================================

/**
 * Attempt to append an init segment to a source buffer.
 * Handles codec changes (re-creating the SB), encryption info propagation,
 * and gapless-restart detection.
 *
 * Returns true if the source buffer is ready for media segments.
 * [was: qF]
 *
 * @param {Object} loader      [was: Q]
 * @param {Object} track       [was: c]
 * @param {Object} sourceBuffer [was: W]
 * @param {Object} slice       [was: m]
 * @returns {boolean}
 */
export function appendInitSegment(loader, track, sourceBuffer, slice) { // was: qF
  slice.info.cueAdVideo.W();
  const initData = slice.info.cueAdVideo.O; // was: K
  if (!initData || !sourceBuffer.DZ() || sourceBuffer.logIllegalStage() === initData) return false; // was: !1

  let dataToAppend = initData; // was: T

  // FairPlay encryption init rewrite for split view mode
  if (loader.policy.YI && sourceBuffer.gw() && sourceBuffer.isView() && isMp4Container(slice.info.cueAdVideo.info)) {
    const view = new DataView(initData.buffer, initData.byteOffset, initData.byteLength); // was: I
    const rewritten = rewriteEncryptionInfo(view, sourceBuffer.gw()); // was: r
    rewritten
      ? (dataToAppend = new Uint8Array(rewritten.buffer, rewritten.byteOffset, rewritten.byteLength))
      : loader.RetryTimer('fenc', {});
  }

  // WebM spoof-to-4K
  loader.policy.yu && (
    (result) => result && (dataToAppend = getUint8View(result))
  )(iJW(loader, slice, new ChunkedByteBuffer([dataToAppend])));

  // Clip info for gapless
  let clipSlice; // was: U
  const clipInfo = slice.info.cueAdVideo.J(0, slice.info.clipId); // was: r (reused)
  clipInfo && (clipSlice = clipInfo.eh[0]);

  // Detect stuck init-segment retries (gapless shorts)
  if (slice === loader.isTvHtml5Exact) {
    loader.MM += 1;
    if (loader.EH.getVideoData().X('html5_shorts_gapless_restart_on_init_seg_retries') && loader.MM > 5) {
      loader.MM = 0;
      loader.EH.LatencyTimer({ initSegStuck: 1, as: slice.info.Pw() }); // was: as (format ID)
      return true; // was: !0
    }
  } else {
    loader.MM = 0;
    loader.isTvHtml5Exact = slice;
  }

  loader.policy.ProtobufMessage && (sourceBuffer.abort(), track.L?.J());

  const appendResult = appendToSourceBuffer(loader, sourceBuffer, dataToAppend, clipSlice, initData); // was: K (reused)
  track.L?.Y(appendResult, clipSlice);

  if (appendResult !== 0) {
    if (loader.policy.xX && isGaplessShortEligible(loader.EH.getVideoData())) {
      loader.EH.writeMessageField() || reportAppendError(loader, 'sepInit', appendResult, slice.info);
      SxX(loader.EH, 'sie');
    } else {
      reportAppendError(loader, 'sepInit', appendResult, slice.info);
    }
    return true;
  }

  // Record timing for first init-segment append
  if (slice.info.MK()) {
    const t = loader.timing; // was: c (reused)
    t.MM || ((t.MM = (0, g.h)()), ensureTransitionPings('vis_a', t.MM, t.W));
  } else {
    const t = loader.timing; // was: c (reused)
    t.J || ((t.J = (0, g.h)()), ensureTransitionPings('ais_a', t.J, t.W));
  }

  // Propagate encryption init data
  const encInfo = slice.info.cueAdVideo.findChapterAtPixel; // was: m (reused)
  encInfo && loader.EH.g9(new ir(encInfo.key, encInfo.type));

  return sourceBuffer.yq();
}

// ============================================================================
// Media-segment append pipeline
// ============================================================================

/**
 * Attempt to append a media segment from the track's pending queue
 * to the corresponding source buffer. Handles:
 *  - Locked-segment detection (delayed EOS)
 *  - Codec change detection and init-segment re-append
 *  - Buffer quota-exceeded recovery (shrink buffer targets)
 *  - BMFF/WebM header stripping for continuation appends
 *
 * Returns true if the append was successful.
 * [was: FxR]
 *
 * @param {Object} loader       [was: Q]
 * @param {Object} track        [was: c]
 * @param {Object} sourceBuffer [was: W]
 * @returns {boolean}
 */
export function appendMediaSegment(loader, track, sourceBuffer) { // was: FxR
  if (loader.policy.XI && Hp(track)?.isLocked) return false; // was: !1
  if (sourceBuffer.gT()) return true; // was: !0
  if (!sourceBuffer.DZ()) return false;

  const pending = Hp(track); // was: m
  if (!pending || pending.info.type === 6) return false;

  // Validate that SSDAI controller allows this segment
  if (loader.policy.oU || loader.j?.mF(track, pending.info.DF)) {
    loader.jG = 0;
  } else {
    loader.Pj.isSeeking() && wB(loader);
    loader.jG = loader.jG || (0, g.h)();
    return false;
  }

  // Set up source buffer codec if needed
  if (!configureSourceBuffer(loader, track, sourceBuffer, pending.info)) return false;

  // Init-segment change detection
  if (loader.k0.O && pending.info.W === 0) {
    let needsInit; // was: K
    if (sourceBuffer.logIllegalStage() == null) {
      const lastAppended = Fo(track); // was: T
      needsInit = !lastAppended || lastAppended.cueAdVideo !== pending.info.cueAdVideo;
      if (!needsInit) {
        // Check for init-data mismatch
        const oldInit = lastAppended.mF; // was: K (reused)
        const newInit = pending.info.mF; // was: T (reused)
        needsInit = oldInit.length !== newInit.length || oldInit.some((v, i) => !g.y1(v, newInit[i]));
      }
    } else {
      const storedInit = sourceBuffer.logIllegalStage(); // was: K (reused)
      pending.info.cueAdVideo.Ie() && YV(pending);
      const freshInit = pending.info.cueAdVideo.O; // was: T (reused)
      needsInit = storedInit !== freshInit && !g.y1(storedInit, freshInit);
    }

    if (needsInit) {
      loader.RetryTimer('initchg', {
        it: pending.info.cueAdVideo.info.id,
        enterRollUp: !!Fo(track) && Fo(track).cueAdVideo === pending.info.cueAdVideo,
        ty: pending.info.type,
        seg: pending.info.DF,
      });
    }

    // Strip moof/mdat headers on continuation appends (BMFF)
    const isBmff = isMp4Container(pending.info.cueAdVideo.info); // was: T (reused)
    if (loader.policy.invokeUnaryRpc && isBmff && !needsInit) {
      if (isMp4Container(pending.info.cueAdVideo.info)) {
        stripBox(g.kV(pending), 1836019574); // moof
        stripBox(g.kV(pending), 1718909296); // free
      } else {
        const ebml = new Kk(g.kV(pending)); // was: K (reused)
        AK0(ebml);
        seekToElement(ebml, 524531317, true); // Cluster, was: !0
        pending.O = pending.O.split(ebml.start + ebml.pos).N4;
      }
      pending.K = false; // was: !1
    }
  }

  // Check if we need to re-append init before this media segment
  const hasLiveSync = loader.L && !!loader.L.j && track.cueAdVideo.info.audio; // was: T (reused)
  const isInitRequired = loader.k0.isManifestless || pending.K; // was: K (reused)
  if (!(loader.k0.O && pending.info.W !== 0 || isInitRequired && !hasLiveSync) && appendInitSegment(loader, track, sourceBuffer, pending)) {
    return true;
  }

  if (hasLiveSync) return false;

  // Check if the segment's start time is within the allowed buffer window
  const maxBufferAhead = computeCodecResetDelay(loader, track); // was: T (reused)
  const bufferLimit = loader.getCurrentTime() + maxBufferAhead; // was: T (reused)
  if (pending.info.j > bufferLimit) {
    if (loader.policy.W) {
      track === loader.videoTrack
        ? (loader.PA = loader.PA || (0, g.h)())
        : (loader.Ka = loader.Ka || (0, g.h)());
    }
    loader.policy.getProgressBarMetrics && bAW(track.A, bufferLimit, false); // was: !1
    return false;
  }

  track === loader.videoTrack ? (loader.PA = 0) : (loader.Ka = 0);

  // Perform the actual append
  const appendStart = loader.policy.isInAdPlayback ? (0, g.h)() : 0; // was: T (reused)
  const initOverride = pending.K && pending.info.cueAdVideo.O || undefined; // was: r, was: void 0
  let rawData = pending.O; // was: U
  pending.K && ((rawData = iJW(loader, pending, rawData)) || (rawData = pending.O));

  const bytes = getUint8View(rawData); // was: I
  const afterCopy = loader.policy.isInAdPlayback ? (0, g.h)() : 0; // was: U (reused)
  const appendCode = appendToSourceBuffer(loader, sourceBuffer, bytes, pending.info, initOverride); // was: W (reused)

  track.L?.L(pending.info, appendCode, afterCopy - appendStart, (0, g.h)() - afterCopy);
  loader.MM = 0;

  if (appendCode === 0) {
    // Success
    loader.XI && ((loader.XI = false), (loader.sC = false)); // was: !1
    loader.Fw = 0;
    // Continue to mark the slice as appended below
  } else {
    // Handle specific error codes
    if (appendCode === 2 || appendCode === 5) {
      reportAppendError(loader, 'checked', appendCode, pending.info);
    } else {
      if (appendCode === 1) {
        // QuotaExceededError
        if (!loader.XI) {
          loader.XI = true; // was: !0
          return false;
        }
        if (!loader.sC) {
          loader.sC = true;
          loader.EH.seekTo(loader.getCurrentTime(), { Z7: 'quotaExceeded', h7: true }); // was: !0
          return false;
        }
        // Shrink buffer targets
        if (pending.info.MK()) {
          const pol = loader.policy; // was: T (reused)
          pol.jG = Math.floor(pol.jG * 0.8);
          pol.Ie = Math.floor(pol.Ie * 0.8);
        } else {
          const pol = loader.policy;
          pol.Y0 = Math.floor(pol.Y0 * 0.8);
          pol.Ie = Math.floor(pol.Ie * 0.8);
        }
        loader.policy.W
          ? o4(loader.K, pending.info.cueAdVideo)
          : resetTrackState(loader.W, pending.info.cueAdVideo);
      }
      loader.EH.LatencyTimer({ reattachOnAppend: appendCode });
    }
    return false;
  }

  // Mark the segment as appended in the track
  if (loader.policy.XI && pending.info.D()) {
    loader.EH.G().cB() && loader.RetryTimer('eosl', { ls: pending.info.Pw() });
    pending.isLocked = true; // was: !0
  } else {
    track.B7(pending);
    recordSegmentBitrate(loader.W, pending.info);
  }

  // Propagate encryption info from the newly-appended segment
  if (isInitRequired) {
    const encInfo = pending.info.cueAdVideo.findChapterAtPixel; // was: c (reused)
    encInfo && loader.EH.g9(new ir(encInfo.key, encInfo.type));
  }

  return true;
}

// ============================================================================
// Append error handling
// ============================================================================

/**
 * Low-level source-buffer append. Returns an error code:
 *   0 = success, 1 = QuotaExceeded, 2 = InvalidState, 3 = readyState error,
 *   4 = other DOMException, 5 = SecurityError, 6 = locked-segment delay.
 *
 * [was: yk0]
 *
 * @param {Object}     loader       [was: Q]
 * @param {Object}     sourceBuffer [was: c]
 * @param {Uint8Array} data         [was: W]
 * @param {Object}     [sliceInfo]  [was: m]
 * @param {Uint8Array} [initData]   [was: K]
 * @returns {number}
 */
export function appendToSourceBuffer(loader, sourceBuffer, data, sliceInfo, initData) { // was: yk0
  try {
    const track = sourceBuffer === loader.loadVideoFromData?.W ? loader.audioTrack : loader.videoTrack; // was: T

    // Delayed EOS handling for locked segments
    if (loader.policy.XI && sliceInfo?.D()) {
      if (sliceInfo?.S > 1) return 6;

      track.Ie = new ThrottleTimer(() => { // was: r
        const pendingSlice = Hp(track); // was: r
        if (loader.u0() || !pendingSlice?.isLocked) {
          loader.EH.G().cB() && loader.RetryTimer('eosl', { delayA: pendingSlice?.info.Pw() });
        } else if (isTrackHeadBuffered(track)) {
          loader.EH.G().cB() && loader.RetryTimer('eosl', { dunlock: pendingSlice?.info.Pw() });
          unlockTrackSegment(loader, track === loader.audioTrack);
        } else {
          loader.RetryTimer('nue', { ls: pendingSlice.info.Pw() });
          pendingSlice.info.S += 1;
          loader.loadVideoFromData && loader.Cu();
        }
      }, 1e4, loader);

      loader.EH.G().cB() && loader.RetryTimer('eosl', { delayS: sliceInfo.Pw() });
      track.Ie.start();
    }

    // Log post-EOS appends for manifestless live
    loader.policy.dispatchLayoutEvent &&
      sliceInfo?.cueAdVideo instanceof SP &&
      sliceInfo.D() &&
      loader.RetryTimer('poseos', {
        itag: sliceInfo.cueAdVideo.info.itag,
        seg: sliceInfo.DF,
        lseg: sliceInfo.cueAdVideo.index.globalSamplingState(),
        OrchestrationAction: sliceInfo.cueAdVideo.index.D,
      });

    sourceBuffer.appendBuffer(data, sliceInfo, initData);
  } catch (err) { // was: T
    if (err instanceof DOMException) {
      if (err.code === 11) return 2; // InvalidStateError
      if (err.code === 12) return 5; // SecurityError
      if (err.code === 22 || err.message.indexOf('Not enough storage') === 0) {
        const details = Object.assign(
          {
            name: 'QuotaExceededError',
            buffered: onApplicationStateChange(sourceBuffer.NoOpLogger()).replace(/,/g, '_'),
            vheap: fE(loader.videoTrack),
            aheap: fE(loader.audioTrack),
            message: g.uj(err.message, 3),
            track: loader.loadVideoFromData ? (sourceBuffer === loader.loadVideoFromData.O ? 'v' : 'a') : 'u',
          },
          qIO()
        );
        loader.handleError('player.exception', details);
        return 1;
      }
      reportErrorWithLevel(err);
    }
    return 4;
  }

  return loader.loadVideoFromData.NK() ? 3 : 0;
}

/**
 * Report an append error with appropriate severity.
 * [was: xz]
 *
 * @param {Object} loader    [was: Q]
 * @param {string} origin    [was: c]
 * @param {number} errorCode [was: W]
 * @param {Object} sliceInfo [was: m]
 */
export function reportAppendError(loader, origin, NetworkErrorCode, sliceInfo) { // was: xz
  let errorName = 'fmt.unplayable'; // was: K
  let severity = 1; // was: T

  if (NetworkErrorCode === 5 || NetworkErrorCode === 3) {
    errorName = 'fmt.unparseable';
    loader.policy.W
      ? !sliceInfo.cueAdVideo.info.video || QI(loader.K.W).size > 0 || o4(loader.K, sliceInfo.cueAdVideo)
      : !sliceInfo.cueAdVideo.info.video || QI(loader.W.K).size > 0 || resetTrackState(loader.W, sliceInfo.cueAdVideo);
  } else if (NetworkErrorCode === 2) {
    if (loader.Fw < 15) {
      loader.Fw++;
      errorName = 'html5.invalidstate';
      severity = 0;
    } else {
      errorName = 'fmt.unplayable';
    }
  }

  const details = fk(sliceInfo); // was: m (reused)
  details.mrs = loader.loadVideoFromData?.A();
  details.origin = origin;
  details.reason = NetworkErrorCode;
  details.trg = 'appenderr';
  loader.handleError(errorName, details, severity);
}

// ============================================================================
// Manifestless live index reconciliation
// ============================================================================

/**
 * Reconcile a newly-received live segment's timing with the existing index.
 * If the segment has a different start time than expected, resets the index.
 * [was: rlx]
 *
 * @param {Object}  loader      [was: Q]
 * @param {Object}  metadata    [was: c] - segment metadata from EMSG
 * @param {*}       [extra]     [was: W]
 * @param {boolean} isVideo     [was: m]
 * @param {*}       [extra2]    [was: K]
 */
export function reconcileLiveIndex(loader, metadata, extra, isVideo, extra2) { // was: rlx
  const manifest = loader.k0; // was: T
  const useSabr = loader.policy.W; // was: r
  let resetTriggered = false; // was: U
  let resetSegment = -1; // was: I

  for (const fmtKey in manifest.W) { // was: e
    const isMatchingTrack = isTextTrackMimeType(manifest.W[fmtKey].info.mimeType) || manifest.W[fmtKey].info.MK(); // was: X

    if (isVideo === isMatchingTrack) {
      const index = manifest.W[fmtKey].index; // was: X (reused)

      if (index.Wb(metadata.DF)) {
        // Check if segment timing has changed
        const existingSeg = index.A(metadata.DF); // was: V
        if (existingSeg && existingSeg.startTime !== metadata.startTime) {
          index.segments = [];
          index.J(metadata);
          resetTriggered = true; // was: !0
        } else {
          resetTriggered = false;
        }

        if (resetTriggered) {
          resetSegment = metadata.DF;
        } else if (!metadata.pending && useSabr) {
          const storedDuration = index.getDuration(metadata.DF); // was: A
          if (storedDuration !== metadata.duration) {
            manifest.publish('clienttemp', 'mfldurUpdate', {
              itag: manifest.W[fmtKey].info.itag,
              seg: metadata.DF,
              od: storedDuration,
              nd: metadata.duration,
            }, false); // was: !1
            index.J(metadata);
          }
        }
      }
    }
  }
}

// ============================================================================
// SABR / Onesie media validation
// ============================================================================

/**
 * Check whether SABR/Onesie media should be accepted for attachment.
 * Validates format, timeline, and various experiment gates.
 * [was: XrW]
 *
 * @param {Object} loader [was: Q]
 * @returns {boolean}
 */
export function validateOnesieMedia(loader) { // was: XrW
  if (!loader.k0.positionMarkerOverlays) return true; // was: !0

  const videoData = loader.EH.getVideoData(); // was: c
  if (loader.EH.iterateCursor()) {
    loader.RetryTimer('ombpa', {});
    return false; // was: !1
  }

  if (!!loader.A?.m1?.qZ !== loader.k0.DE) {
    loader.RetryTimer('ombplmm', {});
    return false;
  }

  const hasStartOffset = videoData.XI || videoData.liveUtcStartSeconds || videoData.Vg; // was: W
  if (loader.k0.DE && hasStartOffset) {
    loader.RetryTimer('ombplst', {});
    return false;
  }

  if (loader.k0.mF) {
    loader.RetryTimer('ombab', {});
    return false;
  }

  const now = Date.now(); // was: W (reused)
  if (
    isPlayableLive(loader.k0) &&
    !isNaN(loader.Ie) &&
    now - loader.Ie > loader.policy.createClientScreen * 1e3
  ) {
    loader.RetryTimer('ombttl', {});
    return false;
  }

  if (
    (hh(videoData) !== 0 && !loader.policy.W) ||
    (videoData.X('html5_disable_onesie_media_for_mosaic') && videoData.xi()) ||
    (videoData.X('html5_disable_onesie_media_for_lifa_eligible') && isSplitScreenEligible(videoData))
  ) {
    return false;
  }

  // Windowed-live boundary check
  if (
    loader.EH.G().getExperimentFlags.W.BA(I23) &&
    ((startMs) => startMs >= 0 && loader.k0.isWindowedLive && (startMs < loader.k0.NF * 1e3 || startMs > loader.k0.Kd * 1e3))(loader.A?.isHttps() ?? 0)
  ) {
    loader.RetryTimer('ombwnd', { st: loader.A?.isHttps() ?? 0 });
    return false;
  }

  if (loader.k0.Kx && loader.k0.isWindowedLive) {
    loader.RetryTimer('ombminsq', {});
    return false;
  }

  return true;
}

// ============================================================================
// Format switching
// ============================================================================

/**
 * Evaluate the current ABR state and apply format switches to both tracks.
 * [was: eg]
 *
 * @param {Object} loader      [was: Q]
 * @param {number} [seekTime]  [was: c]
 */
export function evaluateFormatSwitch(loader, seekTime) { // was: eg
  seekTime = seekTime || loader.videoTrack?.W?.startTime || loader.getCurrentTime();
  const updateFn = RT; // was: W
  const videoTrack = loader.videoTrack; // was: m
  const abrState = loader.W; // was: K

  // Update the ABR target bitrate index based on current seek position
  const targetIndex = (abrState.nextVideo && abrState.nextVideo.index.zf(seekTime)) || 0; // was: c (reused)
  if (abrState.T2 !== targetIndex) {
    abrState.MM = {};
    abrState.T2 = targetIndex;
    KE(abrState, abrState.W);
  }

  const recentSwitch = !abrState.W.isLocked() && abrState.Y > -1 && (0, g.h)() - abrState.Y < abrState.policy.dP * 1e3;
  const hasHeadroom = abrState.nextVideo && estimateBitrate(abrState, abrState.nextVideo.info) * 3 < eF(abrState.isSamsungSmartTV);

  if (!recentSwitch || hasHeadroom) {
    WV(abrState);
    selectNextQuality(abrState);
    abrState.S = abrState.S || abrState.nextVideo !== abrState.A;
  }

  abrState.nextVideo && !abrState.nextVideo.index.isLoaded() && (abrState.T2 = -1);

  updateFn(loader, videoTrack, abrState.nextVideo);
  RT(loader, loader.audioTrack, loader.W.O);
}
