/**
 * Audio Normalization — LUFS-based loudness adjustment, stateful / stateless
 * normalization, audio quality preference filtering, and DRC preference
 * checking.
 *
 * Source: player_es6.vflset/en_US/base.js, lines 34985–35090
 *
 * Handles:
 *  - LUFS (Loudness Units relative to Full Scale) gain calculation
 *  - Stateful loudness normalization with time-windowed target persistence
 *  - Stateless loudness adjustment gain (from server config)
 *  - Default ad gain multiplier
 *  - DRC (Dynamic Range Compression) audio quality preference filtering
 *  - Audio-only and prefer-audio-only detection for various client types
 *  - AV1 codec disabling experiment check
 *  - Format selection configuration building
 *  - Composite broadcast type detection
 */

// ══════════════════════════════════════════════════════════════════════
// computeStatelessNormalizationGain — Simple LUFS → linear gain.
// [was: Am7] — Source lines 34985–34992
// ══════════════════════════════════════════════════════════════════════


import { isCobalt } from '../core/composition-helpers.js'; // was: g.i0
import { isWebMusicIntegrations, isWebRemix } from '../data/performance-profiling.js'; // was: g.EQ, g.uL
import { applyHostOverride } from '../network/service-endpoints.js'; // was: xn
import { shouldUseSabr } from './seek-controller.js'; // was: M8
import { positionMarkerOverlays } from '../ui/progress-bar-impl.js'; // was: UC
import { getClientName } from '../data/performance-profiling.js'; // was: cU
import { hasSapisidCookie } from '../core/event-system.js'; // was: Q2
import { isGaplessShortEligible } from './seek-controller.js'; // was: wA
import { clearChildPlaybacksInRange } from '../player/state-init.js'; // was: uM
import { executeCommand } from '../ads/ad-scheduling.js'; // was: xA
import { AdButton } from '../player/component-events.js'; // was: wK
import { playerBytesSequenceItemLayout } from '../core/misc-helpers.js'; // was: qs
import { skipNextIcon } from '../ui/svg-icons.js'; // was: qQ
import { isCobaltAppleTV } from '../core/composition-helpers.js'; // was: y5
import { isSamsungSmartTV } from '../core/composition-helpers.js'; // was: b0
import { getExperimentFlags } from '../player/time-tracking.js'; // was: Ty()
import { SLOT_MESSAGE_MARKER } from '../proto/messages-core.js'; // was: Ww
import { SurveySubmittedTrigger } from '../ads/ad-trigger-types.js'; // was: Oz
import { listenOnce } from '../core/composition-helpers.js'; // was: E7
import { clamp } from '../core/math-utils.js';
import { getUserAgent } from '../core/browser-detection.js';
import { startsWith } from '../core/string-utils.js';
import { getUserAudio51Preference } from '../player/player-api.js';
import { getPlayerKeyword } from '../player/video-data-helpers.js'; // was: g.YQ
// TODO: resolve g.h
// TODO: resolve g.lm

/**
 * Compute the normalization gain as a linear multiplier using the
 * **stateless** path (no time-windowed memory).
 *
 * The per-content loudness value is taken from `videoData.j?.audio.A`
 * (format-level) or `videoData.Af` (player-response-level).  If valid,
 * `Q.OR` is set to `4` (indicating the stateless path was used).
 *
 * The formula is:
 * ```
 *   gain = min(1, 10^(-loudnessDb / 20))
 * ```
 * which ensures the gain never exceeds unity (i.e. never amplifies).
 *
 * When the video is an ad, the `html5_default_ad_gain` experiment value
 * is used as the fallback multiplier instead of `1`.
 *
 * @param {Object} videoData [was: Q]
 * @returns {number} linear gain multiplier in (0, 1]
 */
export function computeStatelessNormalizationGain(videoData) { // was: Am7
  let defaultGain = 1; // was: c
  const experimentAdGain = getExperimentValue(videoData.LayoutExitedMetadata.experiments, "html5_default_ad_gain"); // was: W
  if (experimentAdGain && videoData.isAd()) defaultGain = experimentAdGain;

  const loudnessDb = videoData.j?.audio.A != null // was: W (reused)
    ? videoData.j?.audio.A
    : videoData.Af;
  if (!isNaN(loudnessDb)) videoData.OR = 4;

  return Math.min(1, 10 ** (-loudnessDb / 20)) || defaultGain;
}

// ══════════════════════════════════════════════════════════════════════
// computeNormalizationGain — Full LUFS gain with stateful path.
// [was: edm] — Source lines 34994–35021
// ══════════════════════════════════════════════════════════════════════

/**
 * Compute the loudness-normalization gain multiplier, choosing between
 * the **stateful** and **stateless** paths based on the
 * `html5_stateful_audio_normalization` experiment flag.
 *
 * ### Stateful path (when experiment is enabled)
 *
 * Uses `videoData.j?.audio.j` (format-level integrated LUFS) or
 * `videoData.xn` (player-response-level fallback).  When the value is
 * available:
 *
 *  1. Determine whether we are within the stateful time window:
 *     `(now - AJ.pF) <= maxStatefulTimeThresholdSec * 1000`.
 *  2. If `applyStatefulNormalization` is true **and** within the window,
 *     use `OR = 2` and clamp the target to `g.lm(AJ.Is, minimumLkfs, targetLkfs)`.
 *  3. Otherwise use the simple `loudnessTargetLkfs`.
 *  4. Compute `deltaDb = clampedTarget - integratedLufs`.
 *  5. In the non-stateful branch, add the server-supplied
 *     `statelessLoudnessAdjustmentGain` offset.
 *  6. Clamp `deltaDb` to be `<= 0` (never amplify).
 *  7. If `preserveStatefulLoudnessTarget` is set, persist the achieved
 *     target back to `AJ.Is` and record the timestamp in `AJ.pF`.
 *  8. Convert to linear: `min(1, 10^(deltaDb / 20))`.
 *
 * ### Stateless fallback
 *
 * Delegates to {@link computeStatelessNormalizationGain}.
 *
 * @param {Object} videoData [was: Q]
 * @returns {number} linear gain multiplier in (0, 1]
 */
export function computeNormalizationGain(videoData) { // was: edm
  if (videoData.X("html5_stateful_audio_normalization")) {
    let defaultGain = 1; // was: m
    const experimentAdGain = getExperimentValue(videoData.LayoutExitedMetadata.experiments, "html5_default_ad_gain"); // was: c
    if (experimentAdGain && videoData.isAd()) defaultGain = experimentAdGain;

    const integratedLufs = videoData.j?.audio.j ?? videoData.applyHostOverride; // was: K
    if (integratedLufs == null || isNaN(integratedLufs)) {
      return computeStatelessNormalizationGain(videoData); // was: Am7(Q)
    }

    const now = (0, g.h)(); // was: c (reused)
    videoData.OR = 1;

    const withinTimeWindow = now - videoData.LayoutExitedMetadata.pF // was: W
      <= videoData.maxStatefulTimeThresholdSec * 1000;

    if (videoData.applyStatefulNormalization && withinTimeWindow) {
      videoData.OR = 2;
    } else if (!withinTimeWindow) {
      videoData.LayoutExitedMetadata.Is = Infinity;
      videoData.LayoutExitedMetadata.pF = NaN;
    }

    // Choose target LUFS: stateful (clamped) or direct
    let deltaDb = ( // was: W (reused)
      videoData.OR === 2
        ? clamp(videoData.LayoutExitedMetadata.Is, videoData.minimumLoudnessTargetLkfs, videoData.loudnessTargetLkfs)
        : videoData.loudnessTargetLkfs
    ) - integratedLufs;

    // Add server-side stateless adjustment when NOT in stateful mode
    if (videoData.OR !== 2) {
      deltaDb += videoData.playerResponse
        ?.playerConfig?.audioConfig?.loudnessNormalizationConfig
        ?.statelessLoudnessAdjustmentGain || 0;
    }

    // Never amplify
    deltaDb = Math.min(deltaDb, 0);

    // Persist stateful target
    if (videoData.preserveStatefulLoudnessTarget) {
      videoData.LayoutExitedMetadata.Is = integratedLufs + deltaDb;
      videoData.LayoutExitedMetadata.pF = now;
    }

    return Math.min(1, 10 ** (deltaDb / 20)) || defaultGain;
  }

  // Stateless fallback
  return computeStatelessNormalizationGain(videoData); // was: Am7(Q)
}

// ══════════════════════════════════════════════════════════════════════
// isAdaptiveMultiVideo — Check for SABR adaptive + multi-video source.
// [was: g.VTW] — Source line 35023–35025
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns `true` when the video data represents a UC (adaptive) stream
 * that also uses the SABR multi-video path (`M8`).
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isAdaptiveMultiVideo(videoData) { // was: g.VTW
  return videoData.positionMarkerOverlays() && shouldUseSabr(videoData);
}

// ══════════════════════════════════════════════════════════════════════
// isSplitScreenEligible — Check split-screen eligibility from config.
// [was: UP] — Source lines 35027–35029
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isSplitScreenEligible(videoData) { // was: UP
  return !!videoData.playerResponse?.playerConfig?.mediaCommonConfig?.splitScreenEligible;
}

// ══════════════════════════════════════════════════════════════════════
// computeTimeSinceCreation — Seconds since a creation timestamp, minus 30 s.
// [was: BhK] — Source lines 35031–35033
// ══════════════════════════════════════════════════════════════════════

/**
 * Computes `max((Date.now() - timestamp) / 1000 - 30, 0)`.
 * Returns `0` for `NaN` input.
 *
 * @param {number} timestampMs [was: Q]
 * @returns {number} seconds (floored at 0)
 */
export function computeTimeSinceCreation(timestampMs) { // was: BhK
  if (isNaN(timestampMs)) return 0;
  return Math.max((Date.now() - timestampMs) / 1000 - 30, 0);
}

// ══════════════════════════════════════════════════════════════════════
// preferAudioOnly — Determine if the video should use audio-only mode.
// [was: bb] — Source lines 34385–34403
// ══════════════════════════════════════════════════════════════════════

/**
 * Checks whether the current playback should be treated as audio-only.
 *
 * This applies when:
 *  - The device declares `deviceIsAudioOnly`, OR
 *  - The music-video type is `"MUSIC_VIDEO_TYPE_ATV"` /
 *    `"MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK"` on eligible clients
 *    (YouTube Music, TVHTML5_SIMPLY with MUSIC theme), OR
 *  - It is an externally-hosted podcast, OR
 *  - On certain cast/TVHTML5 clients with MUSIC theme and version
 *    constraints (Starboard < 10, specific `cver` prefixes).
 *
 * Sets `videoData.Q2 = true` as a side effect when audio-only is chosen.
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function preferAudioOnly(videoData) { // was: bb
  const musicVideoTypes = ["MUSIC_VIDEO_TYPE_ATV", "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK"]; // was: c
  const isSimplyMusic = getClientName(videoData.LayoutExitedMetadata) === "TVHTML5_SIMPLY" // was: W
    && videoData.LayoutExitedMetadata.W.ctheme === "MUSIC";

  if (!videoData.hasSapisidCookie
    && (isWebRemix(videoData.LayoutExitedMetadata) || isWebMusicIntegrations(videoData.LayoutExitedMetadata) || isSimplyMusic)
    && (musicVideoTypes.includes(videoData.musicVideoType) || videoData.isExternallyHostedPodcast)) {
    videoData.hasSapisidCookie = true; // was: !0
  }

  let isOldStarboard; // was: c (reused)
  const starboardInfo = isCobalt(); // was: c (reused)
  if (starboardInfo) {
    const match = /Starboard\/([0-9]+)/.exec(getUserAgent()); // was: c
    isOldStarboard = (match ? parseInt(match[1], 10) : NaN) < 10;
  }

  let isCastMusic = videoData.LayoutExitedMetadata; // was: W (reused)
  isCastMusic = (getClientName(isCastMusic) === "TVHTML5_CAST"
    || (getClientName(isCastMusic) === "TVHTML5"
      && (isCastMusic.W.cver.startsWith("6.20130725")
        || isCastMusic.W.cver.startsWith("6.20130726"))))
    && videoData.LayoutExitedMetadata.W.ctheme === "MUSIC";

  let shouldForce; // was: m
  if (!videoData.hasSapisidCookie) {
    let isTvHtml5V7 = isCastMusic; // was: W (reused)
    if (!isTvHtml5V7) {
      const ctx = videoData.LayoutExitedMetadata; // was: W (reused)
      isTvHtml5V7 = getClientName(ctx) === "TVHTML5" && ctx.W.cver.startsWith("7");
    }
    shouldForce = isTvHtml5V7;
  }

  if (shouldForce && !isOldStarboard) {
    const isPrivateTrack = videoData.musicVideoType === "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK"; // was: c
    const isAtvWithExperiment = ( // was: W
      videoData.X("cast_prefer_audio_only_for_atv_and_uploads")
        || videoData.X("kabuki_pangea_prefer_audio_only_for_atv_and_uploads")
    ) && videoData.musicVideoType === "MUSIC_VIDEO_TYPE_ATV";
    if (isPrivateTrack || isAtvWithExperiment || videoData.isExternallyHostedPodcast) {
      videoData.hasSapisidCookie = true; // was: !0
    }
  }

  return videoData.LayoutExitedMetadata.deviceIsAudioOnly || (videoData.hasSapisidCookie && videoData.LayoutExitedMetadata.L);
}

// ══════════════════════════════════════════════════════════════════════
// isAv1Disabled — Check AV1 disable experiment flag.
// [was: jm] — Source lines 34405–34407
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isAv1Disabled(videoData) { // was: jm
  return videoData.LayoutExitedMetadata.X("html5_disable_av1") ? true : false; // was: !0 : !1
}

// ══════════════════════════════════════════════════════════════════════
// isCompressedDomainComposite — Check composite broadcast type.
// [was: gA] — Source lines 34409–34411
// ══════════════════════════════════════════════════════════════════════

/**
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isCompressedDomainComposite(videoData) { // was: gA
  return videoData.playerResponse?.playerConfig?.compositeVideoConfig
    ?.compositeBroadcastType === "COMPOSITE_BROADCAST_TYPE_COMPRESSED_DOMAIN_COMPOSITE";
}

// ══════════════════════════════════════════════════════════════════════
// buildFormatSelectionConfig — Create the format-selection config object.
// [was: g.Ow] — Source lines 34413–34442
// ══════════════════════════════════════════════════════════════════════

/**
 * Assemble the full format-selection configuration used by the ABR engine.
 *
 * Reads experiment flags, device capabilities, live-stream properties,
 * and user preferences to produce a config object consumed by
 * `Gi_` / `af7` / `Za0`.
 *
 * Notable fields set:
 *  - `qQ`: true when SABR multi-video (`M8`)
 *  - `j` / `K`: Widevine & FairPlay Cobalt dogfood overrides
 *  - `Y` / `A`: ad max-resolution / min-resolution caps
 *  - `Ie`: hard cap on vertical resolution for Shorts
 *  - `PA`: DRM live audio 5.1 flag
 *  - `b0`: VP9 HDR FairPlay disable flag
 *  - `Fw`: non-variable-bitrate codec audio blocking flag
 *  - `T2`: multi-track variable-bitrate codec audio blocking flag
 *
 * @param {Object} videoData [was: Q]
 * @returns {Object} format selection config — stored as `Q.La`
 */
export function buildFormatSelectionConfig(videoData) { // was: g.Ow
  let gaplessFormatSelection = videoData.J; // was: c
  if (videoData.X("html5_gapless_unlimit_format_selection") && isGaplessShortEligible(videoData)) {
    gaplessFormatSelection = false; // was: !1
  }

  const hasEncryptedContent = !!videoData.W && videoData.W.positionMarkerOverlays; // was: W
  let config = hEm(videoData.LayoutExitedMetadata, { // was: c (reused)
    clearChildPlaybacksInRange: videoData.clearChildPlaybacksInRange(),
    h9: hasEncryptedContent,
    f8: preferAudioOnly(videoData), // was: bb(Q)
    GT: videoData.GT,
    rl: gaplessFormatSelection,
    isOtf: videoData.isOtf(),
    CD: videoData.CD(),
    executeCommand: videoData.executeCommand,
    AdButton: videoData.getUserAudio51Preference(),
    disableAv1: isAv1Disabled(videoData), // was: jm(Q)
    playerBytesSequenceItemLayout: isCompressedDomainComposite(videoData), // was: gA(Q)
  });

  if (shouldUseSabr(videoData)) config.skipNextIcon = true; // was: !0

  if (isCobaltAppleTV() && videoData.playerResponse?.playerConfig
    ?.webPlayerConfig?.useCobaltTvosDogfoodFeatures) {
    config.j = true; // was: !0
    config.K = true; // was: !0
  }

  if (videoData.J && videoData.isAd()) {
    if (videoData.r_) config.Y = videoData.r_;
    if (videoData.pF) config.A = videoData.pF;
  }

  if (videoData.cI()) {
    config.Ie = getExperimentValue(
      videoData.LayoutExitedMetadata.experiments,
      "html5_hard_cap_max_vertical_resolution_for_shorts",
    );
  }

  config.PA = videoData.isLivePlayback
    && videoData.Ir()
    && videoData.LayoutExitedMetadata.X("html5_drm_live_audio_51");

  config.isSamsungSmartTV = videoData.Oo;
  if (videoData.X("html5_disable_vp9_hdr_fairplay") && isCobaltAppleTV()) {
    config.isSamsungSmartTV = true; // was: !0
  }

  config.Fw = !shouldUseSabr(videoData);
  config.T2 = !shouldUseSabr(videoData) && videoData.LayoutExitedMetadata.experiments.getExperimentFlags.W.BA(uCm);

  videoData.La = config;
  return config;
}

// ══════════════════════════════════════════════════════════════════════
// getCaptionsLanguagePreference — Resolve effective captions language.
// [was: g.qUw] — Source lines 35068–35070
// ══════════════════════════════════════════════════════════════════════

/**
 * Waterfall:
 *  1. `videoData.captionsLanguagePreference`
 *  2. `AJ.captionsLanguagePreference`
 *  3. Keyword `"yt:cc_default_lang"` from video metadata
 *  4. `AJ.Ww` (global fallback)
 *
 * @param {Object} videoData [was: Q]
 * @returns {string|undefined}
 */
export function getCaptionsLanguagePreference(videoData) { // was: g.qUw
  return videoData.captionsLanguagePreference
    || videoData.LayoutExitedMetadata.captionsLanguagePreference
    || getPlayerKeyword(videoData, "yt:cc_default_lang")
    || videoData.LayoutExitedMetadata.SLOT_MESSAGE_MARKER;
}

// ══════════════════════════════════════════════════════════════════════
// getDaiConfigState — Map DAI config presence to a status code.
// [was: tTO] — Source lines 35084–35086
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns:
 *  - `1` if `Oz` (pre-roll DAI) is set
 *  - `2` if `bN` (mid-roll DAI) is set
 *  - `0` if the DAI config exists but neither flag is active
 *  - `3` if no DAI config exists at all
 *
 * @param {Object} videoData [was: Q]
 * @returns {0|1|2|3}
 */
export function getDaiConfigState(videoData) { // was: tTO
  if (!videoData.playerResponse?.playerConfig?.daiConfig) return 3;
  if (videoData.SurveySubmittedTrigger) return 1;
  if (videoData.bN) return 2;
  return 0;
}

// ══════════════════════════════════════════════════════════════════════
// isSabrLiveEligible — Determine SABR live-streaming XHR eligibility.
// [was: VK] — Source lines 35047–35062
// ══════════════════════════════════════════════════════════════════════

/**
 * Complex eligibility check combining:
 *  - DRM product type exclusion (`drmProduct === "1"` → ineligible for
 *    live DRM path unless overridden)
 *  - `em` (streaming-XHR global capability flag)
 *  - Latency-class gates: normal, low, ultra-low each behind their own
 *    experiment flag
 *  - SSDAI (server-stitched DAI) streaming XHR flag
 *  - Non-streaming XHR fallback (`html5_enable_sabr_live_non_streaming_xhr`)
 *  - VOD SABR path for split-screen (LIFA) eligible streams
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isSabrLiveEligible(videoData) { // was: VK
  // Live DRM streaming XHR path
  let liveDrmEligible; // was: c
  if (em && videoData.positionMarkerOverlays() && videoData.Ir()
    && (videoData.drmProduct === "1" ? false : true) // was: Q.drmProduct === "1" ? !1 : !0
    && videoData.X("html5_sabr_live_drm_streaming_xhr")) {
    liveDrmEligible = true;
  }

  if (!liveDrmEligible) {
    const vodLiveXhr = videoData.positionMarkerOverlays() && !videoData.Ir() && em; // was: c
    const normalLatency = videoData.positionMarkerOverlays() // was: W
      && videoData.latencyClass !== "ULTRALOW"
      && !lb(videoData)
      && videoData.X("html5_sabr_live_normal_latency_streaming_xhr");
    const lowLatency = lb(videoData) // was: m
      && videoData.X("html5_sabr_live_low_latency_streaming_xhr");
    const ultraLowLatency = videoData.latencyClass === "ULTRALOW" // was: K
      && videoData.X("html5_sabr_live_ultra_low_latency_streaming_xhr");
    liveDrmEligible = vodLiveXhr && (normalLatency || lowLatency || ultraLowLatency);
  }

  const ssdaiXhr = videoData.enableServerStitchedDai // was: W (reused in source)
    && liveDrmEligible
    && videoData.X("html5_enable_sabr_ssdai_streaming_xhr");
  const nonSsdaiXhr = !videoData.enableServerStitchedDai && liveDrmEligible; // was: W
  const nonStreamingXhr = videoData.positionMarkerOverlays() // was: m
    && !em
    && videoData.X("html5_enable_sabr_live_non_streaming_xhr");
  const vodSabr = em // was: Q
    && (videoData.listenOnce() || (isSplitScreenEligible(videoData) // was: UP(Q)
      && videoData.X("html5_enable_sabr_for_lifa_eligible_streams")));

  return ssdaiXhr || nonSsdaiXhr || nonStreamingXhr || vodSabr;
}

// ══════════════════════════════════════════════════════════════════════
// isPlaybackStatusOk — Check whether the playability status allows play.
// [was: AV] — Source lines 35064–35066
// ══════════════════════════════════════════════════════════════════════

/**
 * Returns `true` when the video has no `TB` (playability status) or its
 * status is `"OK"` or `"LIVE_STREAM_OFFLINE"`.
 *
 * @param {Object} videoData [was: Q]
 * @returns {boolean}
 */
export function isPlaybackStatusOk(videoData) { // was: AV
  return videoData.TB
    ? ["OK", "LIVE_STREAM_OFFLINE"].includes(videoData.TB.status)
    : true; // was: !0
}
