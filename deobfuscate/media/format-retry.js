// Source: base.js lines 44000–45000
// Format retry logic for AV1 codec, video track degradation on errors,
// error code mapping (fmt.unplayable, html5.invalidstate), MediaError
// extraction, signature expiry handling, and playback restart logic.


import { userAgentContains } from '../core/composition-helpers.js'; // was: g.Hn
import { isTvHtml5 } from '../data/performance-profiling.js'; // was: g.AI
import { qualityLabelToOrdinal } from './codec-tables.js'; // was: g.EU
import { createQualityRange } from '../modules/caption/caption-translation.js'; // was: g.ya
import { PlayerError } from '../ui/cue-manager.js'; // was: g.rh
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { isPlayerInNormalState } from '../ads/ad-prebuffer.js'; // was: iDm
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { cueAdVideo } from '../player/media-state.js'; // was: OH
import { resetTrackState } from './buffer-stats.js'; // was: r4
import { setBgeNetworkStatus } from '../network/uri-utils.js'; // was: HI
import { LayoutRenderingAdapter } from '../ui/cue-manager.js'; // was: il
import { adMessageRenderer } from '../core/misc-helpers.js'; // was: rc
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { parseHexColor } from '../modules/caption/caption-settings.js'; // was: HA
import { getClientName } from '../data/performance-profiling.js'; // was: cU
import { isTvHtml5Exact } from '../data/performance-profiling.js'; // was: Sh
import { toggleFineScrub } from '../ui/seek-bar-tail.js'; // was: EC
import { getPersistedQuality } from '../ads/ad-async.js'; // was: XU
import { ordinalToQualityLabel } from './codec-tables.js'; // was: ZV
import { isSubstituteAdCpnMacroEnabled } from '../player/media-state.js'; // was: vi
import { logSegmentEntryTiming } from '../ads/ad-cue-delivery.js'; // was: de
import { pauseVideo } from '../player/player-events.js';
import { toString } from '../core/string-utils.js';
import { getPlayerState } from '../player/playback-bridge.js';
import { getVideoPlaybackQuality } from '../player/time-tracking.js';

/**
 * Core error handler – attempts codec fallback, AV1 ban, progressive
 * retry, and delayed restarts before giving up.
 * [was: wi]
 *
 * @param {Object} errorHandler   - error-handler instance [was: Q]
 * @param {string} errorCode      - e.g. "fmt.unplayable", "fmt.decode" [was: c]
 * @param {Object} details        - telemetry details bag [was: W]
 * @returns {boolean} true if the error was handled (restart initiated)
 */
export function handlePlaybackError(errorHandler, NetworkErrorCode, details) { // was: wi
  const currentVideoFormat = errorHandler.videoData.O; // was: m
  const currentAudioFormat = errorHandler.videoData.j; // was: K
  const isDrmCodecFallbackDisabled =
    errorHandler.LayoutExitedMetadata.X("html5_disable_codec_fallback_for_drm") &&
    errorHandler.videoData.Ir(); // was: T

  // Notify SSAI if applicable
  if (isOfflineVideo(errorHandler.EH.getVideoData())) { // was: wA
    SxX(errorHandler.EH, "pe"); // was: SxX
  }

  // Annotate background state
  if (errorHandler.LayoutExitedMetadata.getExperimentFlags.W.BA(N83)) {
    details.bkg = errorHandler.EH.OV().isBackground() ? "1" : "0";
  }

  // ── Progressive format-22 retry ──────────────────────────────────────────
  if (
    (NetworkErrorCode === "progressive.net.retryexhausted" ||
      NetworkErrorCode === "fmt.unplayable" ||
      NetworkErrorCode === "fmt.decode") &&
    !errorHandler.EH.aR.K &&
    currentVideoFormat &&
    currentVideoFormat.itag === "22"
  ) {
    errorHandler.EH.aR.K = true; // was: !0
    errorHandler.I$("qoe.restart", { reason: "fmt.unplayable.22" });
    errorHandler.EH.Bb();
    return true;
  }

  // ── Externally-hosted podcast ────────────────────────────────────────────
  let codecFallbackTriggered = false; // was: r
  if (errorHandler.videoData.isExternallyHostedPodcast) {
    const podcastUrl = errorHandler.videoData.Gh; // was: r reused
    if (podcastUrl) {
      details.mimeType = podcastUrl.type;
      errorHandler.RetryTimer("3pp", { url: podcastUrl.url });
    }
    details.ns = "3pp";
    errorHandler.EH.o$(
      NetworkErrorCode,
      1,
      "VIDEO_UNAVAILABLE",
      Tb(new PlayerError(NetworkErrorCode, details, 1).details)
    );
    return true;
  }

  // ── Restart eligibility check ────────────────────────────────────────────
  let canRestart = // was: U
    errorHandler.Y4 + 30_000 < nowMs() || errorHandler.W.isActive();

  // Empty-src ad workaround
  if (
    errorHandler.LayoutExitedMetadata.X("html5_empty_src") &&
    errorHandler.videoData.isAd() &&
    NetworkErrorCode === "fmt.unplayable" &&
    /Empty src/.test(`${details.msg}`)
  ) {
    details.origin = "emptysrc";
    errorHandler.I$("auth", details);
    return true;
  }

  // Pause if not in foreground
  if (!canRestart && !isPlayerInNormalState(errorHandler.EH.OV())) {
    details.nonfg = "paused";
    canRestart = true;
    errorHandler.EH.pauseVideo();
  }

  // ── Codec fallback (audio container mI) ──────────────────────────────────
  if (
    (NetworkErrorCode === "fmt.decode" || NetworkErrorCode === "fmt.unplayable") &&
    currentAudioFormat?.D()
  ) {
    XlO(errorHandler.LayoutExitedMetadata.K, currentAudioFormat.computeAutoHideVisible); // was: XlO (add to codec denylist)
    details.acfallexp = currentAudioFormat.computeAutoHideVisible;
    codecFallbackTriggered = true;
    canRestart = true;
  }

  // Delayed restart counter
  if (!canRestart && errorHandler.A > 0) {
    errorHandler.W.start();
    canRestart = true;
    details.delayed = "1";
    --errorHandler.A;
  }

  // ── Video codec fallback ─────────────────────────────────────────────────
  const loader = errorHandler.EH.loader; // was: K reused
  if (
    !canRestart &&
    (currentVideoFormat?.W() || currentVideoFormat?.j()) &&
    !isDrmCodecFallbackDisabled
  ) {
    XlO(errorHandler.LayoutExitedMetadata.K, currentVideoFormat.computeAutoHideVisible);
    codecFallbackTriggered = true;
    canRestart = true;
    details.cfallexp = currentVideoFormat.computeAutoHideVisible;
  }

  // ── Start-stall exile ────────────────────────────────────────────────────
  if (!canRestart) {
    return handleStartStall(errorHandler, details); // was: D8x
  }

  // ── AV1-specific retry ban ───────────────────────────────────────────────
  let isFirstRestart = false; // was: T
  if (errorHandler.K) {
    errorHandler.Y4 = nowMs();
  } else {
    isFirstRestart = true;
    errorHandler.K = true;
  }

  // Check for stale progressive stream signature
  const videoData = errorHandler.videoData; // was: U
  let isSignatureStale; // was: U reused
  if (videoData.MM) {
    const expiresAt = videoData.MM.K(); // was: U
    const halfHourFromNow = Date.now() / 1000 + 1800; // was: I
    isSignatureStale = expiresAt < halfHourFromNow;
  } else {
    isSignatureStale = false;
  }

  details.e = NetworkErrorCode;
  if (isSignatureStale) details.staleprog = "1";

  errorHandler.I$("qoe.restart", details);

  // Expired signature – refresh instead of restart
  if (isSignatureStale && canRefreshSignature(errorHandler)) { // was: th_
    handleSignatureExpired(errorHandler); // was: HDK
    return true;
  }

  // Philips TV: attempt window.close()
  if (
    !(
      !userAgentContains("philips") ||
      (NetworkErrorCode === "fmt.unplayable" && loader && loader.Ie) ||
      errorHandler.LayoutExitedMetadata.W.cplatform === "GAME_CONSOLE"
    )
  ) {
    try {
      window.close();
    } catch {}
  }

  // ── AV1 ban logic ───────────────────────────────────────────────────────
  if (
    currentVideoFormat &&
    currentVideoFormat.W() &&
    !errorHandler.LayoutExitedMetadata.X("html5_allow_av1_retry_in_session")
  ) {
    const codecState = errorHandler.LayoutExitedMetadata.K; // was: r
    codecState.Y = true;
    codecFallbackTriggered = codecState.W = true;
  } else if (loader) {
    // Degrade the current video track
    if (!isFirstRestart) {
      const headSegment = // was: c
        getHeadPendingSegment(loader.videoTrack) ||
        loader.videoTrack.W;
      const currentFormat = headSegment
        ? headSegment.cueAdVideo
        : loader.videoTrack.cueAdVideo; // was: c reused
      currentFormat.XI += 1;
      if (loader.policy.W) {
        o4(loader.K, currentFormat, true);
      } else {
        resetTrackState(loader.W, currentFormat, true);
      }
    }
  } else if (errorHandler.videoData.MM) {
    errorHandler.videoData.MM.j(); // force progressive refresh
  }

  // Trigger quality re-evaluation
  if (!errorHandler.W.isActive()) {
    errorHandler.EH.setBgeNetworkStatus(codecFallbackTriggered);
  }
  return true;
}

// ── MediaError extraction ────────────────────────────────────────────────────

/**
 * Extracts the MediaError code and message from the media element and
 * attaches them as `merr` / `mmsg` to the error details when the error
 * code is "fmt.unplayable" or "html5.invalidstate".
 * [was: yxK]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {Object} errorObj     - error descriptor with errorCode / details [was: c]
 */
export function extractMediaError(errorHandler, errorObj) { // was: yxK
  const mediaElement = errorHandler.EH.Yx(); // was: Q reused
  if (
    mediaElement &&
    (errorObj.NetworkErrorCode === "fmt.unplayable" ||
      errorObj.NetworkErrorCode === "html5.invalidstate")
  ) {
    const mediaErrorCode = mediaElement.LayoutRenderingAdapter(); // was: W
    errorObj.details.merr = mediaErrorCode ? mediaErrorCode.toString() : "0";
    errorObj.details.mmsg = mediaElement.eB();
  }
}

// ── Error classification helpers ─────────────────────────────────────────────

/**
 * Checks if the error is a fatal network bad-status that blocks playback.
 * [was: SQ_]
 *
 * @param {Object} errorObj [was: Q]
 * @returns {boolean}
 */
export function isFatalNetworkError(errorObj) { // was: SQ_
  return (
    errorObj.NetworkErrorCode === "net.badstatus" &&
    (errorObj.severity === 1 || !!errorObj.details.fmt_unav)
  );
}

/**
 * Checks for a 403-status network error that may indicate an expired
 * signature (Fin = "Forbidden Innertube Network").
 * [was: Fin]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {Object} errorObj     [was: c]
 * @returns {boolean}
 */
export function isForbiddenNetworkError(errorHandler, errorObj) { // was: Fin
  if (
    errorHandler.LayoutExitedMetadata.X("html5_use_network_error_code_enums") &&
    errorObj.details.adMessageRenderer === 403
  ) {
    // With new enum codes, rc is a number
  } else if (errorObj.details.adMessageRenderer === "403") {
    // Legacy string comparison
  } else {
    return false;
  }
  const code = errorObj.NetworkErrorCode; // was: Q
  return code === "net.badstatus" || code === "manifest.net.retryexhausted";
}

// ── Signature / auth refresh ────────────────────────────────────────────────

/**
 * Checks whether the player can attempt a signature refresh.
 * Conditions differ based on app type (yt vs others) and videoData state.
 * [was: th_]
 *
 * @param {Object} errorHandler [was: Q]
 * @returns {boolean}
 */
export function canRefreshSignature(errorHandler) { // was: th_
  if (errorHandler.O) return true; // was: !0

  if (errorHandler.LayoutExitedMetadata.mF === "yt") {
    if (shouldUseSabr(errorHandler.videoData)) { // was: M8 (check manifest type)
      return errorHandler.EH.loader?.dA();
    }
    if (errorHandler.videoData.L) {
      return errorHandler.videoData.parseHexColor < 25;
    }
    return !errorHandler.videoData.parseHexColor;
  }
  return false; // was: !1
}

/**
 * Triggers the signature-expired flow: publishes "signatureexpired" unless
 * the player is paused/suspended and not in an offline-transfer state.
 * [was: HDK]
 *
 * @param {Object} errorHandler [was: Q]
 */
export function handleSignatureExpired(errorHandler) { // was: HDK
  if (!errorHandler.O) {
    errorHandler.O = true; // was: !0
    const playerState = errorHandler.EH.getPlayerState(); // was: c
    const isPausedOrSuspended =
      playerState.isPaused() || playerState.isSuspended(); // was: c reused
    errorHandler.EH.NE();
    if (!isPausedOrSuspended || IZ(errorHandler.videoData)) {
      // IZ = isOfflineTransfer
      errorHandler.EH.publish("signatureexpired");
    }
  }
}

/**
 * Handles a 403-forbidden / stale-signature error. If the signature is
 * refreshable, does so; otherwise, reloads the page on very old sessions.
 * [was: ZD_]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {Object} errorObj     [was: c]
 * @returns {boolean} true if handled
 */
export function handleForbiddenError(errorHandler, errorObj) { // was: ZD_
  if (!isForbiddenNetworkError(errorHandler, errorObj) && !errorHandler.O) {
    return false; // was: !1
  }

  errorObj.details.sts = "20536";

  if (canRefreshSignature(errorHandler)) {
    if (oR(errorObj.severity)) {
      // Wrap into a restart QoE event
      const restartDetails = Object.assign(
        { e: errorObj.NetworkErrorCode },
        errorObj.details
      ); // was: c
      const restartError = new PlayerError("qoe.restart", restartDetails); // was: c
      errorHandler.I$(restartError.NetworkErrorCode, restartError.details);
    } else {
      errorHandler.I$(errorObj.NetworkErrorCode, errorObj.details);
    }
    handleSignatureExpired(errorHandler);
    return true;
  }

  // Session older than 7 days → force page reload
  if (nowMs() - errorHandler.LayoutExitedMetadata.AA > 604_800_000) {
    reloadPage(errorHandler, "signature", true); // was: bc
  }
  return false;
}

/**
 * Reloads the page as a last-resort recovery, optionally asking the
 * Kabuki app layer to handle the reload on TV platforms.
 * [was: bc]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {string} reason       [was: c]
 * @param {boolean} fatal       [was: W]
 */
export function reloadPage(errorHandler, reason, fatal) { // was: bc
  try {
    const detail = { detail: `pr.${reason}` }; // was: c reused
    const isTvPlatform =
      (isTvHtml5Exact(errorHandler.LayoutExitedMetadata) || getClientName(errorHandler.LayoutExitedMetadata) === "TVHTML5_FOR_KIDS") &&
      errorHandler.LayoutExitedMetadata.X("html5_reload_by_kabuki_app");

    if (isTvPlatform) {
      errorHandler.EH.o$(
        "qoe.restart",
        fatal ? 1 : 2,
        undefined,
        Tb(detail),
        "7"
      );
    } else {
      errorHandler.I$("qoe.restart", detail);
      window.location.reload();
    }
  } catch {}
}

/**
 * Checks for error-detail "7" (innertube_player_reload_required)
 * and triggers a page reload when on an AI-capable platform.
 * [was: E5d]
 *
 * @param {Object} errorHandler [was: Q]
 * @returns {boolean} true if handled
 */
export function handleInnertubeReloadRequired(errorHandler) { // was: E5d
  if (
    errorHandler.videoData.errorDetail === "7" &&
    isTvHtml5(errorHandler.LayoutExitedMetadata)
  ) {
    const isMainContent = !errorHandler.videoData.isInlinePlaybackNoAd; // was: c
    if (isMainContent) errorHandler.LayoutExitedMetadata.xi++;
    reloadPage(
      errorHandler,
      "innertube_player_reload_required",
      isMainContent && errorHandler.LayoutExitedMetadata.xi > 1
    );
    return true;
  }
  return false;
}

/**
 * Handles HDR format unavailability by banning HDR and triggering
 * a quality re-evaluation.
 * [was: jg]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {string} [errorCode="fmt.noneavailable"] [was: c]
 */
export function handleHdrUnavailable(errorHandler, NetworkErrorCode = "fmt.noneavailable") { // was: jg
  const codecState = errorHandler.LayoutExitedMetadata.K; // was: W
  codecState.D = false; // was: !1
  codecState.W = true; // was: !0
  errorHandler.I$("qoe.restart", { e: NetworkErrorCode, detail: "hdr" });
  errorHandler.EH.setBgeNetworkStatus(true); // was: !0
}

// ── Start-stall detection ────────────────────────────────────────────────────

/**
 * Detects playback stalled at the very start (first 15 s). After 10
 * consecutive checks with no progress, exiles the playback and
 * publishes "playbackstalledatstart".
 * [was: D8x]
 *
 * @param {Object} errorHandler [was: Q]
 * @param {Object} details      [was: c]
 * @returns {boolean} true if exiled
 */
export function handleStartStall(errorHandler, details) { // was: D8x
  if (errorHandler.videoData.L) return false; // was: !1

  errorHandler.LayoutExitedMetadata.toggleFineScrub += 1;
  if (errorHandler.LayoutExitedMetadata.toggleFineScrub <= 10) return false;

  details.exiled = `${errorHandler.LayoutExitedMetadata.EC}`;
  errorHandler.I$("qoe.start15s", details);
  errorHandler.EH.publish("playbackstalledatstart");
  return true;
}

// ── Quality constraint helpers ──────────────────────────────────────────────

/**
 * Returns the default quality constraint for inline (small player) mode,
 * or falls back to the screen-size–based mapping.
 * [was: ssW]
 *
 * @param {Object} qualityManager [was: Q]
 * @returns {Object} quality constraint (iH instance)
 */
export function getInlineQualityConstraint(qualityManager) { // was: ssW
  if (qualityManager.EH.OV().isInline()) return ab; // was: ab (uncapped)
  const mapped = ordinalToQualityLabel[getPersistedQuality()]; // was: Q  (ZV = ordinal-to-label map, XU = screen height)
  return createQualityRange("auto", mapped, false, "s"); // was: !1
}

/**
 * Determines the chipset-level soft cap based on device capabilities
 * and experiment flags.
 * [was: d8y]
 *
 * @param {Object} qualityManager [was: Q]
 * @param {Object} streamInfo     [was: c]
 * @returns {Object} quality constraint (iH instance)
 */
export function getChipsetSoftCap(qualityManager, streamInfo) { // was: d8y
  let cap; // was: W

  // Determine smooth-playback cap from videoInfos
  if (streamInfo.W?.videoInfos?.length) {
    let found = false;
    for (const info of streamInfo.W.videoInfos) {
      if (info.K?.smooth) {
        cap = info.video.qualityOrdinal;
        found = true;
        break;
      }
    }
    if (!found) {
      cap = streamInfo.W.videoInfos[0].video.qualityOrdinal;
    }
  } else {
    cap = 0;
  }

  // ARM / Android downgrade for VP9
  if (
    (userAgentContains("armv7") || userAgentContains("aarch64") || userAgentContains("android")) &&
    !isTvHtml5(qualityManager.FI) &&
    streamInfo.W.videoInfos[0].j()
  ) {
    cap = Math.min(cap, qualityLabelToOrdinal.large); // 480
  }

  // Experiment-based chipset cap
  const chipsetCap = getExperimentValue(
    qualityManager.FI.experiments,
    "html5_chipset_soft_cap"
  ); // was: m
  if (chipsetCap > 0) {
    cap = Math.min(cap, chipsetCap);
  }

  // Max vertical resolution experiment
  const maxVertRes = getExperimentValue(
    qualityManager.FI.experiments,
    "html5_max_vertical_resolution"
  ); // was: m reused
  if (maxVertRes) {
    let lowestExceedingOrdinal = 4320; // was: r
    for (let i = 0; i < streamInfo.W.videoInfos.length; i++) {
      const isSubstituteAdCpnMacroEnabled = streamInfo.W.videoInfos[i]; // was: T
      if (isSubstituteAdCpnMacroEnabled.video.height > maxVertRes) {
        lowestExceedingOrdinal = Math.min(
          lowestExceedingOrdinal,
          isSubstituteAdCpnMacroEnabled.video.qualityOrdinal
        );
      }
    }
    if (lowestExceedingOrdinal < 4320) {
      let highestBelowCap = 0; // was: K
      for (let i = 0; i < streamInfo.W.videoInfos.length; i++) {
        const ordinal = streamInfo.W.videoInfos[i].video.qualityOrdinal; // was: U
        if (ordinal < lowestExceedingOrdinal) {
          highestBelowCap = Math.max(highestBelowCap, ordinal);
        }
      }
      if (highestBelowCap) {
        cap = Math.min(highestBelowCap, cap);
      }
    }
    qualityManager.EH.RetryTimer("mvr", { h: maxVertRes, cp: cap });
  }

  return new iH(0, cap, false, "o"); // was: !1
}

/**
 * Detects dropped-frame degradation and updates the performance cap
 * when the drop rate exceeds the configured threshold for 3 consecutive
 * sample windows.
 * [was: fmw]
 *
 * @param {Object} perfMonitor   [was: Q]
 * @param {Object} streamInfo    [was: c]
 * @param {Object} videoElement  [was: W]
 * @param {boolean} isPaused     [was: m]
 * @returns {boolean} true if degradation was applied
 */
export function detectFrameDropDegradation(perfMonitor, streamInfo, videoElement, isPaused) { // was: fmw
  if (!streamInfo || !videoElement || !streamInfo.videoData.O) {
    return false; // was: !1
  }

  const threshold = getExperimentValue(
    perfMonitor.FI.experiments,
    "html5_df_downgrade_thresh"
  ); // was: K
  const shouldLog = perfMonitor.X("html5_log_media_perf_info"); // was: T

  // Rate-limit to once per 5 seconds
  if (nowMs() - perfMonitor.j < 5000) return false;
  if (!(shouldLog || threshold > 0)) return false;

  const elapsedSec = (nowMs() - perfMonitor.j) / 1000; // was: r
  perfMonitor.j = nowMs();

  const quality = videoElement.getVideoPlaybackQuality(); // was: W reused
  if (!quality) return false;

  const droppedDelta = quality.droppedVideoFrames - perfMonitor.D; // was: U
  const totalDelta = quality.totalVideoFrames - perfMonitor.L; // was: I
  perfMonitor.D = quality.droppedVideoFrames;
  perfMonitor.L = quality.totalVideoFrames;

  const composited =
    quality.displayCompositedVideoFrames === 0
      ? 0
      : quality.displayCompositedVideoFrames || -1; // was: X

  if (shouldLog && perfMonitor.FI.cB()) {
    perfMonitor.EH.RetryTimer("ddf", {
      dr: quality.droppedVideoFrames,
      logSegmentEntryTiming: quality.totalVideoFrames,
      comp: composited,
    });
  }

  // Reset on pause
  if (isPaused) {
    perfMonitor.W = 0;
    return false;
  }

  // Check effective FPS is above minimum
  if ((totalDelta - droppedDelta) / elapsedSec > perfMonitor.Y) return false;
  if (!threshold || isTvHtml5(perfMonitor.FI)) return false;

  // Accumulate consecutive bad windows
  perfMonitor.W =
    totalDelta > 60 ? (droppedDelta / totalDelta > threshold ? perfMonitor.W + 1 : 0) : perfMonitor.W;

  if (perfMonitor.W !== 3) return false;

  // Apply degradation
  g5K(perfMonitor, streamInfo.videoData.O); // was: g5K (update perf cap)
  perfMonitor.EH.RetryTimer(
    "dfd",
    Object.assign(
      {
        dr: quality.droppedVideoFrames,
        logSegmentEntryTiming: quality.totalVideoFrames,
      },
      ODw() // was: ODw (get saved perf-cap data)
    )
  );
  return true;
}

/**
 * Returns the player canary stage as an enum string.
 * [was: am0]
 *
 * @param {Object} config [was: Q]
 * @returns {string}
 */
export function getCanaryStage(config) { // was: am0
  switch (config.FI.playerCanaryStage?.toLowerCase()) {
    case "xsmall":
      return "HTML5_PLAYER_CANARY_STAGE_XSMALL";
    case "small":
      return "HTML5_PLAYER_CANARY_STAGE_SMALL";
    case "medium":
      return "HTML5_PLAYER_CANARY_STAGE_MEDIUM";
    case "large":
      return "HTML5_PLAYER_CANARY_STAGE_LARGE";
    case "xlarge":
      return "HTML5_PLAYER_CANARY_STAGE_XLARGE";
    default:
      return "HTML5_PLAYER_CANARY_STAGE_UNSPECIFIED";
  }
}
