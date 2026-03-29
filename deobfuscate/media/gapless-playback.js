/**
 * Gapless Playback
 *
 * Format compatibility checks, Shorts gapless validation, and configuration
 * builder for the gapless / pseudo-gapless playback pipeline.
 *
 * Source: base.js lines 52411-52544
 * @module gapless-playback
 */
import { getTimeHead } from '../player/time-tracking.js'; // was: TH()
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { supportsChangeType } from './codec-helpers.js'; // was: Yi
import { RetryTimer } from './grpc-parser.js'; // was: tJ
import { computeAutoHideVisible } from '../player/caption-manager.js'; // was: mI
import { getClippedDuration } from '../player/playback-state.js'; // was: ci
import { ShortsFlags } from '../features/shorts-player.js'; // was: bY0
import { getPlayerState } from '../player/playback-bridge.js';
import { supportsGaplessShorts } from '../player/player-api.js';
import { isChrome } from '../core/browser-detection.js'; // was: g.Am
import { getDrmInfo } from '../player/video-data-helpers.js'; // was: g.Jh

// ---------------------------------------------------------------------------
// Format compatibility check  [was: pv]
// ---------------------------------------------------------------------------

/**
 * Checks whether two players' formats are compatible for gapless transition.
 * Returns `null` when compatible, or an object `{ msg: string }` describing
 * the incompatibility.
 *
 * Checked conditions (in order):
 *   - "player-error"       : next player is in error state
 *   - "in-the-past"        : current player time exceeds transition point
 *   - "live-infinite"      : live playback with non-finite transition time
 *   - "played-ranges"      : media element has >12 played ranges (fragmented)
 *   - "no-pvd-formats"     : previous video data has no adaptive formats
 *   - "non-dash"           : either side is non-DASH
 *   - "no-video-info"      : missing video format info
 *   - "av1"                : AV1 is disabled for gapless
 *   - "container"          : container type mismatch (mp4 vs webm)
 *   - "codec"              : codec string mismatch (strict mode)
 *   - "ratio"              : aspect-ratio mismatch beyond 0.01 tolerance
 *   - "content-protection" : both sides use DRM
 *   - "sample-rate"        : audio sample-rate mismatch (non-Cast)
 *   - "channel-count"      : audio channel-count mismatch
 *   - "fps"                : frame-rate mismatch (Shorts only, gated by config.L)
 *
 * @param {Object} config       - Gapless config [was: bY0 instance].
 * @param {Object} currentPlayer - The currently-playing player.       [was: c]
 * @param {Object} nextPlayer    - The next (queued) player.            [was: W]
 * @param {number} transitionMs  - Transition point in milliseconds.    [was: m]
 * @returns {{ msg: string, [key: string]: any } | null}
 */
export function checkFormatCompatibility(config, currentPlayer, nextPlayer, transitionMs) { // was: pv
  const nextVideoData = nextPlayer.getVideoData();     // was: K
  const currentVideoData = currentPlayer.getVideoData(); // was: T

  if (nextPlayer.getPlayerState().isError()) {
    return { msg: "player-error" };
  }

  let currentFormats = currentVideoData.A; // was: r  (adaptive format set)

  if (currentPlayer.getTimeHead > transitionMs / 1000 + 1) {
    return { msg: "in-the-past" };
  }

  if (currentVideoData.isLivePlayback && !isFinite(transitionMs)) {
    return { msg: "live-infinite" };
  }

  // Check played-range fragmentation
  const mediaElement = currentPlayer.Yx(); // was: m (reused)
  let playedRanges = null;                 // was: U
  if (mediaElement) {
    playedRanges = mediaElement.isView
      ? mediaElement.mediaElement.K()
      : mediaElement.K();
  }
  if (playedRanges && playedRanges.length > 12 && getDrmInfo(nextVideoData)) {
    return { msg: "played-ranges" };
  }

  if (!nextVideoData.A) return null; // no adaptive formats -- allow
  if (!currentFormats) {
    return { msg: "no-pvd-formats" };
  }

  if (!nextVideoData.A.W() || !currentFormats.W()) {
    return { msg: "non-dash" };
  }

  // Resolve video info (may use format-info-fix path for SABR)
  let currentVideoInfo = currentFormats.videoInfos[0]; // was: m (reused)
  let nextVideoInfo = nextVideoData.A.videoInfos[0];   // was: U (reused)

  if (config.mF && isGaplessShortEligible(currentVideoData)) {
    // html5_gapless_use_format_info_fix -- use active format infos
    currentVideoInfo = currentPlayer.yH();
    nextVideoInfo = nextPlayer.yH();
  }

  if (!currentVideoInfo || !nextVideoInfo) {
    return { msg: "no-video-info" };
  }

  // AV1 gating  [was: config.D]
  if (config.D && (currentVideoInfo.W() || nextVideoInfo.W())) {
    return { msg: "av1" };
  }

  // Container mismatch
  const allowContainerDiffOnShorts =
    config.j && currentVideoData.cI() && supportsChangeType(); // was: config.j / h5_gapless_support_types_diff

  if (nextVideoInfo.containerType !== currentVideoInfo.containerType) {
    if (allowContainerDiffOnShorts) {
      currentVideoData.RetryTimer("sgap", { ierr: "container" });
    } else {
      return { msg: "container" };
    }
  }

  // Codec mismatch (strict)  [was: config.K]
  if (
    config.K &&
    !allowContainerDiffOnShorts &&
    (nextVideoInfo.computeAutoHideVisible !== currentVideoInfo.computeAutoHideVisible ||
      nextVideoInfo.computeAutoHideVisible === "" ||
      currentVideoInfo.computeAutoHideVisible === "")
  ) {
    return { msg: "codec" };
  }

  // Aspect-ratio mismatch  [was: config.J]
  if (
    config.J &&
    nextVideoInfo.video &&
    currentVideoInfo.video &&
    Math.abs(
      nextVideoInfo.video.width / nextVideoInfo.video.height -
        currentVideoInfo.video.width / currentVideoInfo.video.height,
    ) > 0.01
  ) {
    return { msg: "ratio" };
  }

  // Both sides DRM-protected
  if (getDrmInfo(currentVideoData) && getDrmInfo(nextVideoData)) {
    return { msg: "content-protection" };
  }

  // Audio checks
  const currentAudioInfo = currentFormats.O[0];          // was: r (reused)
  const nextAudioInfo = nextVideoData.A.O[0];            // was: K (reused)
  const currentAudio = currentAudioInfo.audio;           // was: W (reused)
  const nextAudio = nextAudioInfo.audio;                 // was: I

  // Sample-rate mismatch (allowed on Cast / Chrome)
  if (currentAudio.sampleRate !== nextAudio.sampleRate && !isChrome()) {
    if (allowContainerDiffOnShorts) {
      currentVideoData.RetryTimer("sgap", { ierr: "srate" });
    } else {
      return {
        msg: "sample-rate",
        getClippedDuration: currentAudioInfo.itag,
        cr: currentAudio.sampleRate,
        ni: nextAudioInfo.itag,
        nr: nextAudio.sampleRate,
      };
    }
  }

  // Channel-count mismatch
  if ((currentAudio.numChannels || 2) !== (nextAudio.numChannels || 2)) {
    return { msg: "channel-count" };
  }

  // FPS mismatch (Shorts only, behind config.L flag)
  if (
    config.L &&
    currentVideoData.cI() &&
    currentVideoInfo.video.fps !== nextVideoInfo.video.fps
  ) {
    return { msg: "fps" };
  }

  return null; // fully compatible
}

// ---------------------------------------------------------------------------
// Gapless Shorts validation  [was: w67]
// ---------------------------------------------------------------------------

/**
 * Validates whether a gapless transition is allowed between two Shorts
 * players. Returns `null` when allowed, or `{ nq: string }` with the
 * disqualification reason.
 *
 * Reasons:
 *   - "env"      : environment does not support gapless Shorts
 *   - "autoplay" : autoplay policy prevents transition
 *   - "endcr"    : end-credits cue is set (endSeconds > 0)
 *   - "client"   : client-side gapless flag not set on video data
 *   - "no-empty" : queue is not empty (cannot perform gapless swap)
 *   - (delegated to `checkFormatCompatibility` via `pv`)
 *
 * @param {Object} currentPlayer - Currently-playing player.  [was: Q]
 * @param {Object} nextPlayer    - Next (queued) player.       [was: c]
 * @param {Object} config        - Gapless config.             [was: W / bY0]
 * @returns {{ nq: string } | null}
 */
export function validateGaplessShorts(currentPlayer, nextPlayer, config) { // was: w67
  const currentVideoData = currentPlayer.getVideoData(); // was: m
  const nextVideoData = nextPlayer.getVideoData();       // was: K

  if (!currentVideoData.G().supportsGaplessShorts()) {
    return { nq: "env" };
  }

  // Autoplay policy gates  [was: config.Y / config.O / config.A]
  if (
    (!config.Y || (currentVideoData.F_ && !currentVideoData.isAd()) || (nextVideoData.F_ && !nextVideoData.isAd())) &&
    (!config.O || (currentVideoData.F_ && !currentVideoData.isAd()) || nextVideoData.F_) &&
    (!config.A || (nextVideoData.F_ && !nextVideoData.isAd()) || currentVideoData.F_) &&
    (currentVideoData.F_ || nextVideoData.F_)
  ) {
    return { nq: "autoplay" };
  }

  if (currentVideoData.endSeconds > 0) {
    return { nq: "endcr" };
  }

  if (!currentVideoData.J) {
    return { nq: "client" };
  }

  if (!currentPlayer.Zr()) {
    return { nq: "no-empty" };
  }

  // Delegate to full format-compatibility check
  const formatResult = checkFormatCompatibility(config, currentPlayer, nextPlayer, Infinity);
  return formatResult != null ? { nq: formatResult.msg } : null;
}

// ---------------------------------------------------------------------------
// Gapless configuration builder  [was: joy]
// ---------------------------------------------------------------------------

/**
 * Builds a gapless playback configuration object (`bY0`) from experiment
 * flags on the given experiments source.
 *
 * Experiment flags consumed:
 *   - h5_gapless_support_types_diff             -> config.j  [was: j]
 *   - html5_gapless_use_format_info_fix         -> config.mF [was: mF]
 *   - html5_gapless_disable_on_av1              -> config.D  [was: D]
 *     (unless html5_gapless_enable_on_av1 overrides)
 *   - html5_gapless_check_codec_diff_strictly   -> config.K  [was: K]
 *   - html5_gapless_on_ad_autoplay              -> config.Y  [was: Y]
 *   - html5_gapless_disable_diff_aspect_radio   -> config.J  [was: J]
 *   - html5_gapless_ad_autoplay_on_ad_to_video_only
 *     (gated by !html5_disable_loop_range_for_shorts_ads)
 *                                               -> config.O  [was: O]
 *   - html5_pseudogapless_shorts_seek_to_next_start
 *                                               -> config.W  [was: W]
 *   - html5_gapless_ad_autoplay_on_video_to_ad_only
 *                                               -> config.A  [was: A]
 *
 * @param {Object} experiments - Object exposing `.X(flagName)` for flag queries.
 * @returns {Object} The populated `bY0` configuration. [was: bY0]
 */
export function buildGaplessConfig(experiments) { // was: joy
  const config = new ShortsFlags(); // was: bY0

  config.j = experiments.X("h5_gapless_support_types_diff");
  config.L = false;
  config.mF = experiments.X("html5_gapless_use_format_info_fix");
  config.D =
    experiments.X("html5_gapless_disable_on_av1") &&
    !experiments.X("html5_gapless_enable_on_av1");
  config.K = experiments.X("html5_gapless_check_codec_diff_strictly");
  config.Y = experiments.X("html5_gapless_on_ad_autoplay");
  config.J = experiments.X("html5_gapless_disable_diff_aspect_radio");
  config.O =
    experiments.X("html5_gapless_ad_autoplay_on_ad_to_video_only") &&
    !experiments.X("html5_disable_loop_range_for_shorts_ads");
  config.W = experiments.X("html5_pseudogapless_shorts_seek_to_next_start");
  config.A = experiments.X("html5_gapless_ad_autoplay_on_video_to_ad_only");

  return config;
}
